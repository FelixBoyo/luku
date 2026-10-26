import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env.local') });

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
    console.error('db:introspect failed: SUPABASE_DB_URL is not set in .env.local');
    process.exit(1);
}

const PHASE2_TABLES = [
    'profiles',
    'products',
    'wishlist',
    'wardrobe_items',
    'clothing_items',
    'outfits',
    'listings',
    'cart_items',
    'orders',
    'inbox_threads',
    'inbox_messages',
];

const LEGACY_BUCKETS = [
    'product-images',
    'business-assets',
    'user-profile-images',
    'style-playground-images',
];

function parseIntrospectionSections(sqlText) {
    const headerPattern = /^-- =+\s*\r?\n-- (\d+)\.\s+(.+?)\s*\r?\n-- =+\s*\r?\n/gm;
    const headers = [...sqlText.matchAll(headerPattern)];
    const sections = [];

    for (let i = 0; i < headers.length; i++) {
        const match = headers[i];
        const title = `${match[1]}. ${match[2].trim()}`;
        const bodyStart = match.index + match[0].length;
        const bodyEnd = i + 1 < headers.length ? headers[i + 1].index : sqlText.length;
        const sql = sqlText
            .slice(bodyStart, bodyEnd)
            .split('\n')
            .filter((line) => !line.trim().startsWith('--'))
            .join('\n')
            .trim();
        if (!sql) continue;

        const statements = sql
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        sections.push({ title, statements });
    }

    return sections;
}

function slugify(title) {
    return title
        .toLowerCase()
        .replace(/^\d+\.\s*/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function toMarkdownTable(rows, columns) {
    if (!rows.length) return '_No rows._\n';
    const header = `| ${columns.join(' | ')} |`;
    const sep = `| ${columns.map(() => '---').join(' | ')} |`;
    const body = rows
        .map((row) => `| ${columns.map((c) => String(row[c] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`)
        .join('\n');
    return `${header}\n${sep}\n${body}\n`;
}

function getPlannedMigration(table) {
    const map = {
        profiles: '003',
        products: '001',
        wishlist: '006',
        wardrobe_items: '004',
        clothing_items: 'legacy/004',
        outfits: '004',
        listings: '005',
        cart_items: '006',
        orders: '001',
        inbox_threads: '007',
        inbox_messages: '007',
    };
    return map[table] ?? '—';
}

async function main() {
    const sqlPath = path.join(repoRoot, 'docs', 'database', 'introspection.sql');
    const sqlText = readFileSync(sqlPath, 'utf8');
    const sections = parseIntrospectionSections(sqlText);

    const client = new pg.Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    const capturedAt = new Date().toISOString();
    const exportDir = path.join(repoRoot, 'docs', 'database', 'exports', capturedAt.slice(0, 10));
    mkdirSync(exportDir, { recursive: true });

    const snapshot = {
        capturedAt,
        projectRef: process.env.SUPABASE_PROJECT_ID ?? null,
        sections: {},
    };

    console.log('Connecting to Supabase Postgres…');
    await client.connect();

    try {
        for (const section of sections) {
            const slug = slugify(section.title);
            const sectionResults = [];

            for (let i = 0; i < section.statements.length; i++) {
                const statement = section.statements[i];
                try {
                    const result = await client.query(statement);
                    sectionResults.push({
                        queryIndex: i,
                        rowCount: result.rowCount,
                        fields: result.fields.map((f) => f.name),
                        rows: result.rows,
                    });
                } catch (error) {
                    sectionResults.push({
                        queryIndex: i,
                        error: error.message,
                        rowCount: 0,
                        fields: [],
                        rows: [],
                    });
                    console.warn(`  ⚠ ${section.title} query ${i + 1}: ${error.message}`);
                }
            }

            snapshot.sections[slug] = {
                title: section.title,
                results: sectionResults,
            };

            const outPath = path.join(exportDir, `${slug}.json`);
            writeFileSync(outPath, JSON.stringify(sectionResults, null, 2));
            console.log(`  ✓ ${section.title} → ${path.relative(repoRoot, outPath)}`);
        }
    } finally {
        await client.end();
    }

    const publicTables = (snapshot.sections['tables-and-views-public-auth-metadata']?.results[0]?.rows ?? [])
        .filter((r) => r.table_schema === 'public' && r.table_type === 'BASE TABLE')
        .map((r) => r.table_name);

    const publicViews = (snapshot.sections['tables-and-views-public-auth-metadata']?.results[0]?.rows ?? [])
        .filter((r) => r.table_schema === 'public' && r.table_type === 'VIEW')
        .map((r) => r.table_name);

    const rpcs = (snapshot.sections['functions-rpcs-public']?.results[0]?.rows ?? []).map(
        (r) => r.function_name
    );

    const buckets = (snapshot.sections['storage-buckets']?.results[0]?.rows ?? []).map((r) => r.name);

    const healthRpcs =
        snapshot.sections['quick-health-checks-platform-gate']?.results[0]?.rows?.map(
            (r) => r.routine_name
        ) ?? [];

    const activeProducts =
        snapshot.sections['quick-health-checks-platform-gate']?.results[1]?.rows?.[0]
            ?.active_products ?? null;

    const gapTables = PHASE2_TABLES.map((table) => ({
        table,
        inLiveDb: publicTables.includes(table),
        plannedMigration: getPlannedMigration(table),
    }));

    const gapBuckets = LEGACY_BUCKETS.map((name) => ({
        name,
        inLiveDb: buckets.includes(name),
    }));

    const summaryLines = [
        '# Supabase introspection summary',
        '',
        '| Field | Value |',
        '|-------|-------|',
        `| Captured at | ${capturedAt} |`,
        `| Project ref | ${snapshot.projectRef ?? '_unknown_'} |`,
        `| Export dir | \`docs/database/exports/${capturedAt.slice(0, 10)}/\` |`,
        '',
        `## Public tables (${publicTables.length})`,
        '',
        publicTables.map((t) => `- \`${t}\``).join('\n') || '_None_',
        '',
        `## Public views (${publicViews.length})`,
        '',
        publicViews.map((t) => `- \`${t}\``).join('\n') || '_None_',
        '',
        `## RPCs (${rpcs.length})`,
        '',
        rpcs.map((r) => `- \`${r}\``).join('\n') || '_None_',
        '',
        `## Storage buckets (${buckets.length})`,
        '',
        toMarkdownTable(
            (snapshot.sections['storage-buckets']?.results[0]?.rows ?? []).map((r) => ({
                name: r.name,
                public: r.public,
                file_size_limit: r.file_size_limit,
            })),
            ['name', 'public', 'file_size_limit']
        ),
        '',
        '## Platform gate health',
        '',
        `- \`search_products_paginated\`: ${healthRpcs.includes('search_products_paginated') ? 'yes' : '**missing**'}`,
        `- \`create_order_with_stock_check\`: ${healthRpcs.includes('create_order_with_stock_check') ? 'yes' : '**missing**'}`,
        `- Active products: ${activeProducts ?? 'n/a'}`,
        '',
        '## Phase 2 table gap analysis',
        '',
        toMarkdownTable(
            gapTables.map((g) => ({
                table: g.table,
                in_live_db: g.inLiveDb ? 'yes' : 'no',
                migration: g.plannedMigration,
            })),
            ['table', 'in_live_db', 'migration']
        ),
        '',
        '## Legacy bucket gap analysis',
        '',
        toMarkdownTable(
            gapBuckets.map((b) => ({
                bucket: b.name,
                in_live_db: b.inLiveDb ? 'yes' : 'no',
            })),
            ['bucket', 'in_live_db']
        ),
        '',
        `Full JSON per section in \`docs/database/exports/${capturedAt.slice(0, 10)}/\`.`,
        'Re-run: `npm run db:introspect`',
        '',
    ];

    const summaryPath = path.join(exportDir, 'summary.md');
    writeFileSync(summaryPath, summaryLines.join('\n'));

    const snapshotPath = path.join(repoRoot, 'docs', 'database', 'live-snapshot.json');
    writeFileSync(
        snapshotPath,
        JSON.stringify(
            {
                capturedAt,
                projectRef: snapshot.projectRef,
                publicTables,
                publicViews,
                rpcs,
                buckets,
                healthRpcs,
                activeProducts,
                gapTables,
                gapBuckets,
            },
            null,
            2
        )
    );

    writeFileSync(
        path.join(repoRoot, 'docs', 'database', 'exports', 'LATEST.txt'),
        `${capturedAt.slice(0, 10)}\n`
    );

    console.log(`\nSummary: ${path.relative(repoRoot, summaryPath)}`);
    console.log(`Snapshot: ${path.relative(repoRoot, snapshotPath)}`);
    console.log(`\nPublic tables: ${publicTables.length} | RPCs: ${rpcs.length} | Buckets: ${buckets.length}`);
    console.log(
        `Health: search_products_paginated=${healthRpcs.includes('search_products_paginated')}, create_order_with_stock_check=${healthRpcs.includes('create_order_with_stock_check')}, active_products=${activeProducts}`
    );
}

main().catch((error) => {
    console.error('db:introspect failed:', error.message);
    process.exit(1);
});
