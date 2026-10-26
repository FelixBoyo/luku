import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.join(repoRoot, 'apps', 'mobile');
const workspaceRoot = repoRoot;

const {
    resolvePackage,
    getRequiredPackageNames,
} = require(path.join(projectRoot, 'metro', 'monorepo-resolver.js'));

const context = { projectRoot, workspaceRoot };
const required = getRequiredPackageNames(context);
const unresolved = [];

for (const name of required) {
    const resolved = resolvePackage(name, context);
    if (!resolved) {
        unresolved.push(name);
    }
}

if (unresolved.length > 0) {
    console.error('verify:mobile failed: Metro cannot resolve these packages:');
    for (const name of unresolved) {
        console.error(`  - ${name}`);
    }
    console.error(
        '\nFix: npm install <package> --workspace=@luku/mobile (from repo root), then npm run dev:mobile:clean'
    );
    process.exit(1);
}

console.log(`verify:mobile ok: ${required.length} packages resolvable for Metro`);
for (const name of ['react', 'react-native', 'scheduler', 'semver']) {
    console.log(`  - ${name} -> ${resolvePackage(name, context)}`);
}
