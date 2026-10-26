#!/usr/bin/env node
/**
 * Diagnose the server's Supabase credentials.
 *
 * "new row violates row-level security policy" during checkout means the BFF
 * reached Postgres with something other than the service role. The key itself
 * is never printed — only its class, project ref, and whether it can actually
 * write.
 *
 *   node scripts/check-supabase-key.mjs           # decode + read probe
 *   node scripts/check-supabase-key.mjs --write   # also prove an insert works
 *
 * `--write` calls `ensure_payment_record` (the same SECURITY DEFINER RPC
 * checkout uses) and tries to delete the sentinel. A table insert here would
 * 42501 for the same reason checkout did. Cleanup delete can still fail RLS;
 * insert succeeding is the checkout question.
 *
 * For schema-level questions — whether `service_role` still has BYPASSRLS, or
 * which policies exist — use `npm run diagnose:rls`, which reads Postgres
 * directly instead of inferring from PostgREST responses.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const wantsWrite = process.argv.includes('--write');

// Same order and precedence as the server, so this cannot disagree with it.
const ENV_FILES = ['.env', '.env.local'];
const loaded = [];

for (const file of ENV_FILES) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) {
        continue;
    }
    dotenv.config({ path: full, override: true });
    loaded.push(file);
}

const line = (label, value) => console.log(`  ${label.padEnd(22)} ${value}`);

console.log('\nEnv files');
for (const file of ENV_FILES) {
    const present = loaded.includes(file);
    line(file, present ? 'loaded' : 'not found');
}
if (loaded.length === 0) {
    console.log('\n  No env file found at the repo root. The server has nothing to read.');
    process.exit(1);
}
console.log('  (later files win; apps/mobile/.env is NOT read by the server)');

const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const url =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    (process.env.SUPABASE_PROJECT_ID
        ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
        : undefined);

console.log('\nCredentials');

if (!key) {
    line('service role key', 'MISSING');
    console.log('\n  SUPABASE_SERVICE_ROLE_KEY is not set. Checkout cannot write payments.');
    process.exit(1);
}

let keyClass = 'unrecognized';
let keyRef;
let bypassesRls = false;

if (key.startsWith('sb_secret_')) {
    keyClass = 'sb_secret_ (new secret key)';
    bypassesRls = true;
} else if (key.startsWith('sb_publishable_')) {
    keyClass = 'sb_publishable_ (PUBLISHABLE — cannot bypass RLS)';
} else {
    const parts = key.split('.');
    if (parts.length === 3) {
        try {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            keyClass = `legacy JWT, role="${payload.role ?? 'unknown'}"`;
            keyRef = payload.ref;
            bypassesRls = payload.role === 'service_role';
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                keyClass += ' [EXPIRED]';
                bypassesRls = false;
            }
        } catch {
            keyClass = 'malformed JWT';
        }
    }
}

line('service role key', keyClass);
line('key length', String(key.length));
line('SUPABASE_URL', url ?? 'MISSING');

const urlRef = url ? new URL(url).hostname.split('.')[0] : undefined;
if (keyRef && urlRef && keyRef !== urlRef) {
    line('project mismatch', `key="${keyRef}" url="${urlRef}"`);
}

if (!bypassesRls) {
    console.log(
        '\n  This key cannot bypass RLS. Put the service_role / sb_secret_ key in\n' +
            '  .env.local as SUPABASE_SERVICE_ROLE_KEY, then restart the API.'
    );
    process.exit(1);
}

if (!url) {
    process.exit(1);
}

const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
});

console.log('\nLive probe');

const { count: visibleRows, error: readError } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true });

if (readError) {
    line('read payments', `FAILED — ${readError.message}`);
    console.log('\n  Could not reach the database. Check network and SUPABASE_URL.');
    process.exit(1);
}

// A bare "read ok" is meaningless here: `payments` only exposes rows where
// `auth.uid() = buyer_id`, which is false for a service key, so a constrained
// role reads zero rows without erroring. The count is the signal.
line('payments rows visible', String(visibleRows ?? 0));
if ((visibleRows ?? 0) === 0) {
    line('', 'zero — either the table is empty or RLS is being applied');
    line('', 'run `npm run diagnose:rls` to tell those apart');
}

// The Auth admin API is service-role only, so a 401 here proves the key that
// reaches the server is not privileged even when the local decode looked fine.
const { data: users, error: adminError } = await supabase.auth.admin.listUsers({ perPage: 1 });

if (adminError) {
    line('auth admin api', `FAILED — ${adminError.message}`);
    console.log('\n  The key is not accepted as service role by this project.');
    process.exit(1);
}

line('auth admin api', 'ok (service role accepted)');

if (!wantsWrite) {
    console.log('\n  Re-run with --write to prove an insert works (what checkout does).');
    process.exit(0);
}

const buyerId = users.users[0]?.id;
if (!buyerId) {
    console.log('\n  No user to attribute the sentinel payment to; skipping write probe.');
    process.exit(0);
}

const reference = `diagnostic_${Date.now()}`;
const { data: inserted, error: writeError } = await supabase.rpc('ensure_payment_record', {
    p_buyer_id: buyerId,
    p_reference: reference,
    p_provider: 'paystack',
    p_amount_minor: 0,
    p_currency: 'KES',
    p_status: 'failed',
});

if (writeError) {
    line('insert payments', `FAILED — ${writeError.message}`);
    if (/row-level security/i.test(writeError.message) || writeError.code === '42501') {
        console.log(
            '\n  The DEFINER RPC was refused. Apply migration 016\n' +
                '  (`node scripts/apply-migrations.mjs 16 16`) and restart the API.'
        );
    }
    process.exit(1);
}

line('insert payments', 'ok');

const { error: deleteError } = await supabase.from('payments').delete().eq('id', inserted);
if (deleteError) {
    line('cleanup', `left in place — ${deleteError.message}`);
} else {
    line('cleanup', 'sentinel row removed');
}

console.log('\n  Checkout can write payments through ensure_payment_record.\n');
