import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mobileSrc = path.join(repoRoot, 'apps', 'mobile', 'src');
const mobilePkg = path.join(repoRoot, 'apps', 'mobile', 'package.json');

const FORBIDDEN_IMPORTS = [
    '@supabase/supabase-js',
    "from '../lib/supabase'",
    'from "../lib/supabase"',
    "from './lib/supabase'",
    'from "./lib/supabase"',
];

const FORBIDDEN_FILES = [
    path.join(mobileSrc, 'lib', 'supabase.ts'),
    path.join(mobileSrc, 'api', 'products.ts'),
];

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(full));
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            files.push(full);
        }
    }
    return files;
}

const errors = [];

for (const file of FORBIDDEN_FILES) {
    if (fs.existsSync(file)) {
        errors.push(`Forbidden file still exists: ${path.relative(repoRoot, file)}`);
    }
}

const pkg = JSON.parse(fs.readFileSync(mobilePkg, 'utf8'));
if (pkg.dependencies?.['@supabase/supabase-js']) {
    errors.push(
        'apps/mobile/package.json still lists @supabase/supabase-js — remove the dependency',
    );
}

for (const file of walk(mobileSrc)) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(repoRoot, file);
    for (const pattern of FORBIDDEN_IMPORTS) {
        if (content.includes(pattern)) {
            errors.push(`${rel}: forbidden import/reference "${pattern}"`);
        }
    }
    if (/\bsupabase\.from\s*\(/.test(content)) {
        errors.push(`${rel}: direct supabase.from() call`);
    }
}

if (errors.length > 0) {
    console.error('verify:no-mobile-supabase failed:\n');
    for (const err of errors) {
        console.error(`  - ${err}`);
    }
    console.error(
        '\nMobile must use Express BFF only (ADR-1). See apps/mobile/src/lib/config.ts.',
    );
    process.exit(1);
}

console.log('verify:no-mobile-supabase ok: no Supabase client in apps/mobile/src');
