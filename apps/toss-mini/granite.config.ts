import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'flower-map-toss-mini',
  appName: 'flower-map',
  plugins: [
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
