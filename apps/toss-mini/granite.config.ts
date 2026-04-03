import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';
import { env } from '@granite-js/plugin-env';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 로드
const envLocalPath = path.resolve(__dirname, '.env.local');
const envVars: Record<string, string> = {};
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) envVars[key] = value;
  }
}

const workspaceRoot = path.resolve(__dirname, '../..');
const appNodeModules = path.resolve(__dirname, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');

export default defineConfig({
  scheme: 'flower-map-toss-mini',
  appName: 'flower-map',
  metro: {
    watchFolders: [workspaceRoot, workspaceNodeModules],
    resolver: {
      nodeModulesPaths: [appNodeModules, workspaceNodeModules],
    },
  },
  plugins: [
    env(envVars),
    appsInToss({
      brand: {
        displayName: '꽃 어디',
        primaryColor: '#5C9E66',
        icon: '',
      },
      permissions: [
        {
          name: 'geolocation',
          access: 'access',
        },
      ],
    }),
  ],
});
