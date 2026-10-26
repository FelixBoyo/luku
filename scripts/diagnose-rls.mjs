#!/usr/bin/env node
/**
 * Answer why `payments` inserts are refused with "new row violates row-level
 * security policy" while the configured key decodes as `service_role`.
 *
 *   npm run diagnose:rls
 *
 * Reads the same tables two ways and compares:
 *
 *   1. Directly over Postgres (SUPABASE_DB_URL), which bypasses PostgREST and
 *      reports ground truth about roles, RLS flags and row counts.
 *   2. Through PostgREST with SUPABASE_SERVICE_ROLE_KEY, which is what the BFF
 *      actually uses.
 *
 * A service role that cannot see rows it provably owns is not bypassing RLS,
 * and that is the whole bug. Strictly read-only; no key is ever printed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Same order and precedence as backend/config/loadEnv.ts.
for (const file of ['.env', '.env.local']) {
    const full = path.join(root, file);
    if (fs.existsSync(full)) {
        dotenv.config({ path: full, override: true });
    }
}

const line = (label, value) => console.log(`  ${label.padEnd(26)} ${value}`);
const heading = (text) => console.log(`\n${text}`);

const connectionString = process.env.SUPABASE_DB_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const url =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    (process.env.SUPABASE_PROJECT_ID
        ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
        : undefined);

if (!connectionString) {
    console.error('SUPABASE_DB_URL is not set in .env.local — cannot read ground truth.');
    process.exit(1);
}
if (!serviceKey || !url) {
    console.error('SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL are required.');
    process.exit(1);
}

const fingerprint = createHash('sha256').update(serviceKey).digest('hex').slice(0, 8);
const kind = serviceKey.startsWith('sb_secret_')
    ? 'secret'
    : serviceKey.startsWith('sb_publishable_')
      ? 'publishable'
      : serviceKey.split('.').length === 3
        ? 'jwt'
        : 'unrecognized';

heading('Key this process is using');
line('kind', kind);
line('fingerprint', fingerprint);
console.log('  (must match the API boot line: Supabase key: ... fingerprint=...)');

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

let directCount = null;
let bypassesRls = null;

try {
    await client.connect();

    heading('Roles (ground truth from pg_roles)');
    const { rows: roles } = await client.query(
        `select rolname, rolbypassrls
           from pg_roles
          where rolname in ('service_role', 'authenticator', 'anon', 'authenticated', 'postgres')
          order by rolname`
    );
    for (const role of roles) {
        line(role.rolname, role.rolbypassrls ? 'BYPASSRLS' : 'subject to RLS');
        if (role.rolname === 'service_role') {
            bypassesRls = role.rolbypassrls;
        }
    }

    heading('public.payments');
    const { rows: table } = await client.query(
        `select relrowsecurity, relforcerowsecurity
           from pg_class
          where relname = 'payments' and relnamespace = 'public'::regnamespace`
    );
    if (table.length === 0) {
        line('table', 'MISSING — migration 012 has not been applied');
    } else {
        line('row level security', table[0].relrowsecurity ? 'enabled' : 'disabled');
        line('forced for owner', table[0].relforcerowsecurity ? 'yes' : 'no');
    }

    const { rows: policies } = await client.query(
        `select policyname, cmd
           from pg_policies
          where schemaname = 'public' and tablename = 'payments'
          order by policyname`
    );
    if (policies.length === 0) {
        line('policies', 'none (service role only by design)');
    } else {
        for (const policy of policies) {
            line(`policy ${policy.cmd}`, policy.policyname);
        }
    }
    if (!policies.some((p) => p.cmd === 'INSERT' || p.cmd === 'ALL')) {
        line('insert policy', 'none — inserts require a role that bypasses RLS');
    }

    const { rows: counted } = await client.query('select count(*)::int as total from public.payments');
    directCount = counted[0].total;
    line('rows (direct)', String(directCount));

    // A trigger writing to a second table reports RLS against *that* table, so
    // the message can name a table the insert never mentioned.
    const { rows: triggers } = await client.query(
        `select tgname, pg_get_triggerdef(oid) as def
           from pg_trigger
          where tgrelid = 'public.payments'::regclass and not tgisinternal
          order by tgname`
    );
    if (triggers.length === 0) {
        line('triggers', 'none');
    } else {
        for (const trigger of triggers) {
            line(`trigger ${trigger.tgname}`, trigger.def.replace(/^.*EXECUTE/i, 'EXECUTE'));
        }
    }

    heading('Checkout write path');
    const { rows: funcs } = await client.query(
        `select p.proname,
                p.prosecdef,
                pg_get_userbyid(p.proowner) as owner,
                r.rolbypassrls as owner_bypasses
           from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           join pg_roles r on r.oid = p.proowner
          where n.nspname = 'public'
            and p.proname = 'ensure_payment_record'`
    );
    if (funcs.length === 0) {
        line('ensure_payment_record', 'MISSING — apply migration 016');
    } else {
        for (const fn of funcs) {
            line(
                fn.proname,
                `${fn.prosecdef ? 'SECURITY DEFINER' : 'SECURITY INVOKER'} owner=${fn.owner}` +
                    `${fn.prosecdef ? (fn.owner_bypasses ? ' (BYPASSRLS)' : ' (subject to RLS)') : ''}`
            );
        }
    }
} finally {
    await client.end();
}

heading('Same table through PostgREST with the service key');

const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

const { count: restCount, error } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true });

if (error) {
    line('rows (PostgREST)', `FAILED — ${error.message}`);
} else {
    line('rows (PostgREST)', String(restCount ?? 0));
}

heading('Verdict');

if (bypassesRls === false) {
    console.log(
        '  The `service_role` database role does NOT have BYPASSRLS. That alone\n' +
            '  explains the failure: every write is evaluated against policies, and\n' +
            '  `payments` has no INSERT policy. Restore it in the Supabase dashboard\n' +
            '  (or `alter role service_role bypassrls`) — no application change helps.'
    );
} else if (error) {
    console.log('  Could not reach PostgREST. Fix connectivity and re-run.');
} else if (directCount > 0 && (restCount ?? 0) === 0) {
    console.log(
        '  Postgres holds rows that the service key cannot see, so PostgREST is NOT\n' +
            '  applying the service role to these requests — it is falling back to a\n' +
            '  role that RLS constrains. The key decodes correctly and GoTrue accepts\n' +
            '  it, so this is a key-class problem: try the new `sb_secret_...` key from\n' +
            '  Project Settings > API Keys, then restart the API.'
    );
} else if (directCount === 0) {
    console.log(
        '  `payments` is empty, so the read comparison proves nothing. Re-run after a\n' +
            '  charge exists, or use `node scripts/check-supabase-key.mjs --write`.'
    );
} else {
    console.log(
        '  The service key sees every row, so it is bypassing RLS correctly. The\n' +
            '  insert failure is not a credentials problem — capture the full Postgres\n' +
            '  error from the failing checkout and look at the row being written.'
    );
}

console.log('');
