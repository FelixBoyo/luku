const fs = require('fs');
const path = require('path');

const NESTED_PARENTS = [
    'react-native',
    'expo',
    'react-native-reanimated',
    '@expo/cli',
];

const MANUAL_EXTRAS = ['semver'];

function packageExists(dir) {
    return fs.existsSync(path.join(dir, 'package.json'));
}

function resolvePackage(name, { projectRoot, workspaceRoot }) {
    const mobileModules = path.resolve(projectRoot, 'node_modules');
    const rootModules = path.resolve(workspaceRoot, 'node_modules');

    const candidates = [
        path.join(mobileModules, name),
        path.join(rootModules, name),
        ...NESTED_PARENTS.flatMap((parent) => [
            path.join(rootModules, parent, 'node_modules', name),
            path.join(mobileModules, parent, 'node_modules', name),
        ]),
    ];

    for (const candidate of candidates) {
        if (packageExists(candidate)) {
            return candidate;
        }
    }

    return null;
}

function getRequiredPackageNames({ projectRoot, workspaceRoot }) {
    const names = new Set(['react', 'react-native', 'scheduler', 'semver']);

    const rnPath = resolvePackage('react-native', { projectRoot, workspaceRoot });
    if (rnPath) {
        const rnPkg = require(path.join(rnPath, 'package.json'));
        for (const dep of Object.keys(rnPkg.dependencies ?? {})) {
            names.add(dep);
        }
    }

    for (const extra of MANUAL_EXTRAS) {
        names.add(extra);
    }

    return [...names];
}

function buildExtraNodeModules({ projectRoot, workspaceRoot }) {
    const extra = {};

    const reactPath = path.resolve(projectRoot, 'node_modules/react');
    if (packageExists(reactPath)) {
        extra.react = reactPath;
    }

    const rnPath = resolvePackage('react-native', { projectRoot, workspaceRoot });
    if (!rnPath) {
        throw new Error('react-native not found for Metro monorepo resolver');
    }
    extra['react-native'] = rnPath;

    const rnPkg = require(path.join(rnPath, 'package.json'));
    for (const dep of Object.keys(rnPkg.dependencies ?? {})) {
        const resolved = resolvePackage(dep, { projectRoot, workspaceRoot });
        if (resolved) {
            extra[dep] = resolved;
        }
    }

    for (const name of MANUAL_EXTRAS) {
        const resolved = resolvePackage(name, { projectRoot, workspaceRoot });
        if (resolved) {
            extra[name] = resolved;
        }
    }

    return extra;
}

module.exports = {
    NESTED_PARENTS,
    resolvePackage,
    getRequiredPackageNames,
    buildExtraNodeModules,
};
