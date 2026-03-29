import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '꽃 어디',
  slug: 'kkoteodi',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/kkoticon.png',
  scheme: 'kkoteodi',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    icon: './assets/images/kkoticon_flat.png',
    bundleIdentifier: 'com.kkoteodi.mobile',
    entitlements: {
      'com.apple.developer.applesignin': ['Default'],
    },
    infoPlist: {
      LSApplicationQueriesSchemes: ['nmap'],
      NSUserNotificationsUsageDescription: '주요 꽃 행사 소식을 알려드리기 위해 알림을 사용합니다.',
    },
  },
  android: {
    package: 'com.kkoteodi.mobile',
    googleServicesFile: './android/app/google-services.json',
    adaptiveIcon: {
      backgroundColor: '#FFF9F3',
      foregroundImage: './assets/images/kkoticon_foreground.png',
      monochromeImage: './assets/images/kkoticon.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [],
  },
  web: {
    output: 'static',
    favicon: './assets/images/kkoticon.png',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.0',
        },
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24,
        },
      },
    ],
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: 'jbgn2o8h0j',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/kkoticon.png',
        color: '#FFF9F3',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        android_app_id: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? '',
        ios_app_id: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? '',
      },
    ],
  ],
  privacyPolicyUrl: 'https://kkoteodie.nextvine.app/privacy',
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'c4af274d-b7c9-4d43-a479-00e6ae4d1944',
    },
  },
  owner: 'nextvines-organization',
});
