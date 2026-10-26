#!/usr/bin/env node
/**
 * Smoke test for Phase 4 AI Endpoints.
 * Tests live or local backend endpoints against real or dev authentication.
 *
 * Usage:
 *   node scripts/smoke-ai-endpoints.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['.env', '.env.local']) {
    const full = path.join(root, file);
    if (fs.existsSync(full)) {
        dotenv.config({ path: full, override: true });
    }
}

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
const devEmail = process.env.DEV_USER_EMAIL || 'dev+buyer@luku.app';
const devPassword = process.env.DEV_USER_PASSWORD || 'LukuDev2026!';

async function request(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
}

async function main() {
    console.log(`\n🤖 Testing AI Endpoints on ${baseUrl}...\n`);

    // 1. Health check
    const health = await request('GET', '/v1/api/health');
    if (!health.ok) {
        throw new Error(`API server is not reachable at ${baseUrl}. Ensure 'npm run dev:api' is running.`);
    }
    console.log('  ✓ [0/4] Backend server is reachable');

    // 2. Dev login
    const login = await request('POST', '/v1/api/auth/login', {
        email: devEmail,
        password: devPassword,
    });

    if (!login.ok || !login.json.data?.accessToken) {
        throw new Error(`Login failed for ${devEmail}: ${login.json.message || login.status}`);
    }
    const token = login.json.data.accessToken;
    console.log(`  ✓ Authenticated as ${devEmail}`);

    // 3. Test OOTD
    console.log('\n--- 1. Testing GET /v1/api/ai/ootd ---');
    const ootd = await request('GET', '/v1/api/ai/ootd', undefined, token);
    if (!ootd.ok || !ootd.json.data?.ootd) {
        throw new Error(`GET /v1/api/ai/ootd failed: ${ootd.json.message || ootd.status}`);
    }
    const ootdData = ootd.json.data.ootd;
    console.log(`  ✓ OOTD Title: "${ootdData.title}" (${ootdData.occasion})`);
    console.log(`  ✓ Match Score: ${ootdData.matchScore}%`);
    console.log(`  ✓ Pieces (${ootdData.pieces.length}): ${ootdData.pieces.map(p => p.name).join(', ')}`);

    // 4. Test Recommendations
    console.log('\n--- 2. Testing GET /v1/api/ai/recommendations ---');
    const recs = await request('GET', '/v1/api/ai/recommendations', undefined, token);
    if (!recs.ok || !recs.json.data) {
        throw new Error(`GET /v1/api/ai/recommendations failed: ${recs.json.message || recs.status}`);
    }
    const recsData = recs.json.data;
    if (recsData.pickedForYou) {
        console.log(`  ✓ Picked For You: "${recsData.pickedForYou.title}" (${recsData.pickedForYou.matchPercentage}% match)`);
    }
    console.log(`  ✓ Trending Pieces: ${recsData.trending.length} items`);
    console.log(`  ✓ You Might Also Like: ${recsData.youMightLike.length} items`);
    console.log(`  ✓ More For You: ${recsData.moreForYou.length} items`);

    // 5. Test Wardrobe Pairings
    console.log('\n--- 3. Testing GET /v1/api/ai/wardrobe-pairings ---');
    const pairings = await request('GET', '/v1/api/ai/wardrobe-pairings', undefined, token);
    if (!pairings.ok || !pairings.json.data?.pairings) {
        throw new Error(`GET /v1/api/ai/wardrobe-pairings failed: ${pairings.json.message || pairings.status}`);
    }
    const pairList = pairings.json.data.pairings;
    console.log(`  ✓ Returned ${pairList.length} wardrobe pairing(s)`);
    if (pairList[0]) {
        console.log(`    Example: [${pairList[0].wardrobeItemName}] paired with [${pairList[0].pairedProductTitle}] (${pairList[0].matchPercentage}% match)`);
    }

    // 6. Test Stylist Outfit Suggestions
    console.log('\n--- 4. Testing POST /v1/api/ai/outfit-suggestions ---');
    const suggestions = await request(
        'POST',
        '/v1/api/ai/outfit-suggestions',
        {
            occasion: 'Evening Dinner',
            description: 'Sophisticated minimalist look for a chilly rooftop evening in Nairobi',
        },
        token,
    );
    if (!suggestions.ok || !suggestions.json.data?.suggestions) {
        throw new Error(`POST /v1/api/ai/outfit-suggestions failed: ${suggestions.json.message || suggestions.status}`);
    }
    const sugList = suggestions.json.data.suggestions;
    console.log(`  ✓ Generated ${sugList.length} outfit suggestion(s)`);
    if (sugList[0]) {
        console.log(`    Outfit: "${sugList[0].name}" (Match Score: ${sugList[0].matchScore ?? 'N/A'}%)`);
        console.log(`    Description: ${sugList[0].description ?? 'N/A'}`);
        console.log(`    Pieces (${sugList[0].pieces.length}): ${sugList[0].pieces.map(p => p.name).join(', ')}`);
        if (sugList[0].styleEnhancers?.length) {
            console.log(`    Style Enhancers: ${sugList[0].styleEnhancers.map(e => `${e.name} (${e.matchPercentage}%)`).join(', ')}`);
        }
    }

    console.log('\n🎉 All AI endpoints verified and responding successfully!\n');
}

main().catch((err) => {
    console.error('\n❌ Smoke test failed:', err.message);
    process.exit(1);
});
