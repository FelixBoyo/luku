import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mobileSrc = path.join(repoRoot, 'apps', 'mobile', 'src');

const SCAN_DIRS = ['screens', 'context', 'components'].map((d) =>
    path.join(mobileSrc, d),
);

const MOCK_IMPORT_RE = /from\s+['"][^'"]*data\/mock\//;

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(full));
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
            files.push(full);
        }
    }
    return files;
}

const errors = [];

for (const dir of SCAN_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
        const content = fs.readFileSync(file, 'utf8');
        if (MOCK_IMPORT_RE.test(content)) {
            errors.push(path.relative(repoRoot, file));
        }
    }
}

if (errors.length > 0) {
    console.error('verify:no-direct-mock-imports failed:\n');
    for (const err of errors) {
        console.error(`  - ${err}: imports from data/mock/`);
    }
    console.error(
        '\nScreens, context, and components must use repositories and types/domain — not data/mock/.',
    );
    console.error('See apps/mobile/docs/MOCK_DATA_POLICY.md');
    process.exit(1);
}

console.log(
    'verify:no-direct-mock-imports ok: no data/mock/ imports in screens, context, or components',
);
