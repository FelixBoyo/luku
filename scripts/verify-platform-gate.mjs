import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env.local') });

const baseUrl = (process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3001}`).replace(
    /\/$/,
    '',
);
const devEmail = process.env.DEV_SEED_EMAIL ?? 'dev+buyer@luku.app';
const devPassword = process.env.DEV_SEED_PASSWORD ?? 'LukuDev2026!';

async function request(method, path, body, token) {
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const json = await response.json().catch(() => ({}));
    return { response, json };
}

async function main() {
    console.log(`Platform gate verify → ${baseUrl}`);

    const health = await request('GET', '/v1/api/health');
    if (!health.response.ok || !health.json.success) {
        throw new Error(`health check failed: ${health.response.status}`);
    }
    console.log('  ✓ GET /v1/api/health');

    const login = await request('POST', '/v1/api/auth/login', {
        email: devEmail,
        password: devPassword,
    });
    if (!login.response.ok || !login.json.success || !login.json.data?.accessToken) {
        throw new Error(
            `login failed: ${login.json.message ?? login.response.status} (is dev:api running? SUPABASE_SERVICE_ROLE_KEY set?)`,
        );
    }
    console.log('  ✓ POST /v1/api/auth/login');
    const token = login.json.data.accessToken;

    const products = await request('GET', '/v1/api/products?limit=5', undefined, token);
    const items = products.json.data?.items ?? [];
    if (!products.response.ok || !products.json.success || items.length < 1) {
        throw new Error(
            `products list failed or empty (run npm run db:seed). status=${products.response.status}`,
        );
    }
    console.log(`  ✓ GET /v1/api/products (${items.length} item(s))`);

    const ai = await request(
        'POST',
        '/v1/api/ai/outfit-suggestions',
        { occasion: 'Weekend' },
        token,
    );
    if (!ai.response.ok || !ai.json.success) {
        throw new Error(`AI stub failed: ${ai.response.status}`);
    }
    console.log('  ✓ POST /v1/api/ai/outfit-suggestions (stub)');

    const signupEmail = `gate-test+${Date.now()}@luku.app`;
    const signup = await request('POST', '/v1/api/auth/signup', {
        email: signupEmail,
        password: devPassword,
        displayName: 'Gate Test',
    });
    if (!signup.response.ok || !signup.json.success) {
        throw new Error(`signup failed: ${signup.json.message ?? signup.response.status}`);
    }
    console.log('  ✓ POST /v1/api/auth/signup');

    console.log('\nPlatform gate verification passed.');
}

main().catch((error) => {
    console.error('\nverify:gate failed:', error.message);
    process.exit(1);
});
