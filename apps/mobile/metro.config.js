const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { buildExtraNodeModules } = require('./metro/monorepo-resolver');

/**
 * Metro config for the Expo (RN) build inside this monorepo.
 *
 * - watchFolders: lets Metro see files outside apps/mobile/, specifically
 *   the shared `core/` package at the repo root.
 * - nodeModulesPaths: mobile node_modules first, then repo root for hoisted deps.
 * - extraNodeModules: built by metro/monorepo-resolver.js — pins react to the
 *   mobile copy and maps react-native transitive deps (scheduler, semver, etc.)
 *   that npm hoists or nests where flat lookup cannot find them.
 * - disableHierarchicalLookup: only resolve via nodeModulesPaths + extraNodeModules.
 *
 * The `@core` alias is configured in babel.config.js via
 * babel-plugin-module-resolver; Metro needs watchFolders once Babel rewrites
 * imports to relative paths under core/.
 *
 * Keep in sync with apps/mobile/babel.config.js.
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.extraNodeModules = buildExtraNodeModules({
    projectRoot,
    workspaceRoot,
});
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
