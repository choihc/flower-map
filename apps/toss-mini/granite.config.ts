import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';
import { env } from '@granite-js/plugin-env';
import * as path from 'path';

const envVars = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://ktmykdcmknaqsomzeank.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable__TfGxnQaNqCg96SKwTUCCA_5vrI-SKE',
};

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
        primaryColor: '#C45C7E',
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
