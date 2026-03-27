const fs = require('fs');
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const expoRouterRoot = path.join(projectRoot, 'node_modules', 'expo-router');
const pnpmStoreRoot = path.join(projectRoot, 'node_modules', '.pnpm');

const expoRouterExtensions = [
  '.ios.ts',
  '.native.ts',
  '.ts',
  '.ios.tsx',
  '.native.tsx',
  '.tsx',
  '.ios.mjs',
  '.native.mjs',
  '.mjs',
  '.ios.js',
  '.native.js',
  '.js',
  '.ios.jsx',
  '.native.jsx',
  '.jsx',
  '.ios.json',
  '.native.json',
  '.json',
  '.ios.cjs',
  '.native.cjs',
  '.cjs',
];

function resolveExpoRouterFile(moduleName) {
  if (!moduleName.startsWith('expo-router/')) {
    return null;
  }

  const subpath = moduleName.slice('expo-router/'.length);
  const candidates = [path.join(expoRouterRoot, subpath)];

  for (const extension of expoRouterExtensions) {
    candidates.push(path.join(expoRouterRoot, `${subpath}${extension}`));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

const config = getDefaultConfig(projectRoot);
const defaultResolveRequest = config.resolver.resolveRequest;

config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), pnpmStoreRoot])
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const expoRouterFile = resolveExpoRouterFile(moduleName);

  if (expoRouterFile) {
    return {
      filePath: expoRouterFile,
      type: 'sourceFile',
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
