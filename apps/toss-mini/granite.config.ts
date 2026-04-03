import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  appName: 'flower-map',
  scheme: 'flower-map-toss-mini',
  plugins: [
    appsInToss({
      brand: {
        displayName: '꽃 어디',
        primaryColor: '#5C9E66',
        icon: '',
      },
      permissions: [],
    }),
  ],
});
