import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env.local') });

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
    console.error('apply-migrations failed: SUPABASE_DB_URL is not set in .env.local');
    process.exit(1);
}

const fromArg = process.argv[2];
const toArg = process.argv[3];
const from = fromArg ? Number(fromArg) : 3;
const to = toArg ? Number(toArg) : 8;

const migrationsDir = path.join(repoRoot, 'database', 'migrations');
const files = readdirSync(migrationsDir)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort()
    .filter((f) => {
        const num = Number(f.slice(0, 3));
        return num >= from && num <= to;
    });

if (!files.length) {
    console.error(`No migration files found for range ${from}–${to}`);
    process.exit(1);
}

const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function main() {
    console.log(`Applying migrations ${from}–${to} (${files.length} file(s))…`);
    await client.connect();

    try {
        for (const file of files) {
            const sqlPath = path.join(migrationsDir, file);
            const sql = readFileSync(sqlPath, 'utf8');
            console.log(`\n→ ${file}`);
            await client.query(sql);
            console.log(`  ✓ applied`);
        }
    } finally {
        await client.end();
    }

    console.log('\nDone.');
}

main().catch((error) => {
    console.error('\napply-migrations failed:', error.message);
    if (error.position) {
        console.error(`  at SQL position ${error.position}`);
    }
    process.exit(1);
});
