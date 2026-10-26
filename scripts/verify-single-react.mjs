import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collectReactVersions(node, versions = new Map(), packageName = null) {
    if (!node || typeof node !== 'object') {
        return versions;
    }

    if (packageName === 'react' && node.version) {
        const key = node.version;
        const entry = versions.get(key) ?? { version: key, paths: [] };
        if (node.path && !entry.paths.includes(node.path)) {
            entry.paths.push(node.path);
        }
        versions.set(key, entry);
    }

    const dependencies = node.dependencies;
    if (dependencies && typeof dependencies === 'object') {
        for (const [name, child] of Object.entries(dependencies)) {
            collectReactVersions(child, versions, name);
        }
    }

    return versions;
}

let tree;
try {
    const output = execSync('npm ls react --all --json', {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    tree = JSON.parse(output);
} catch (error) {
    const stdout = error.stdout?.toString?.() ?? '';
    if (!stdout.trim()) {
        console.error('verify:deps failed: could not read npm dependency tree.');
        console.error(error.stderr?.toString?.() ?? error.message);
        process.exit(1);
    }
    tree = JSON.parse(stdout);
}

const versions = collectReactVersions(tree);
const versionList = [...versions.values()];

if (versionList.length === 0) {
    console.error('verify:deps failed: react is not installed in the workspace.');
    process.exit(1);
}

if (versionList.length > 1) {
    console.error('verify:deps failed: multiple react versions detected.');
    for (const { version, paths } of versionList) {
        console.error(`\nreact@${version}`);
        for (const installPath of paths) {
            console.error(`  - ${installPath}`);
        }
    }
    console.error('\nFix: align root package.json overrides with apps/mobile/package.json, then reinstall from repo root.');
    process.exit(1);
}

const [{ version, paths }] = versionList;
console.log(`verify:deps ok: single react@${version}`);
if (paths.length > 0) {
    for (const installPath of paths) {
        console.log(`  - ${installPath}`);
    }
}
