import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env.local') });

const DEV_PASSWORD = 'LukuDev2026!';

const DEV_USERS = [
    {
        id: 'f0000001-0000-4000-8000-000000000001',
        email: 'dev+buyer@luku.app',
        metadata: { display_name: 'Shannon Martinez' },
    },
    {
        id: 'f0000001-0000-4000-8000-000000000002',
        email: 'dev+seller@luku.app',
        metadata: { display_name: 'Chic Boutique' },
    },
    {
        id: 'f0000001-0000-4000-8000-000000000003',
        email: 'dev+seller2@luku.app',
        metadata: { display_name: 'Vintage Vibes' },
    },
];

async function ensureDevUsers() {
    const projectId = process.env.SUPABASE_PROJECT_ID;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url =
        process.env.SUPABASE_URL ??
        (projectId ? `https://${projectId}.supabase.co` : null);

    if (!url || !serviceKey) {
        console.warn(
            'Skipping auth user bootstrap (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local).',
        );
        console.warn('Public seed SQL still requires the fixed dev user UUIDs to exist in auth.users.');
        return;
    }

    const admin = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    for (const user of DEV_USERS) {
        const { error } = await admin.auth.admin.createUser({
            id: user.id,
            email: user.email,
            password: DEV_PASSWORD,
            email_confirm: true,
            user_metadata: user.metadata,
        });

        if (!error) {
            console.log(`  ✓ auth user ${user.email}`);
            continue;
        }

        if (/already|exists|registered|duplicate/i.test(error.message)) {
            const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
                email: user.email,
                password: DEV_PASSWORD,
                email_confirm: true,
                user_metadata: user.metadata,
            });
            if (updateError) {
                throw new Error(`update ${user.email}: ${updateError.message}`);
            }
            console.log(`  ✓ auth user ${user.email} (updated)`);
            continue;
        }

        throw new Error(`create ${user.email}: ${error.message}`);
    }
}

async function runSqlFile(relativePath) {
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) {
        throw new Error('SUPABASE_DB_URL is not set in .env.local');
    }

    const sqlPath = path.join(repoRoot, relativePath);
    const sql = readFileSync(sqlPath, 'utf8');

    const client = new pg.Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    try {
        await client.query(sql);
    } finally {
        await client.end();
    }
}

async function main() {
    const hasServiceRole = Boolean(
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
            (process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_ID),
    );

    if (hasServiceRole) {
        console.log('Ensuring dev auth users (Admin API)…');
        await ensureDevUsers();
    } else {
        console.log('Bootstrapping dev auth users via SQL…');
        await runSqlFile('database/seeds/dev_auth_users.sql');
        console.log('  ✓ auth users ready');
    }

    console.log('\nApplying database/seeds/dev_seed.sql…');
    await runSqlFile('database/seeds/dev_seed.sql');
    console.log('  ✓ seed applied');

    console.log('\nDev logins (password for all):', DEV_PASSWORD);
    for (const user of DEV_USERS) {
        console.log(`  ${user.email}`);
    }
    console.log('\nDone. Run npm run db:introspect to verify active_products count.');
}

main().catch((error) => {
    console.error('\ndb:seed failed:', error.message);
    process.exit(1);
});
