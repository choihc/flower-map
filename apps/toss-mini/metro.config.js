const path = require('path');
const fs = require('fs');

const workspaceRoot = path.resolve(__dirname, '../..');
const appNodeModules = path.resolve(__dirname, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');

// .env.local 로드
const envLocalPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// process.env 값을 번들 실행 전에 주입하는 폴리필 파일 생성
const envKeys = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
];
const polyfillLines = envKeys
  .filter((k) => process.env[k])
  .map((k) => `process.env["${k}"] = ${JSON.stringify(process.env[k])};`);

const envPolyfillPath = path.resolve(__dirname, '.metro-env-polyfill.js');
fs.writeFileSync(envPolyfillPath, polyfillLines.join('\n') + '\n');

module.exports = {
  watchFolders: [workspaceRoot, workspaceNodeModules],
  resolver: {
    nodeModulesPaths: [appNodeModules, workspaceNodeModules],
  },
  serializer: {
    getPolyfills: () => [envPolyfillPath],
  },
};
