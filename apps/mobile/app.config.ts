import type { ExpoConfig, ConfigContext } from 'expo/config';
import { withDangerousMod } from '@expo/config-plugins';
import type { ConfigPlugin, ExportedConfigWithProps } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

/** prebuild --clean 후에도 local.properties를 자동 생성 */
const withLocalProperties: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    (cfg: ExportedConfigWithProps) => {
      const androidDir = cfg.modRequest.platformProjectRoot;
      const localPropsPath = path.join(androidDir, 'local.properties');
      const sdkDir =
        process.env.ANDROID_HOME ??
        path.join(process.env.HOME ?? '', 'Library', 'Android', 'sdk');
      if (!fs.existsSync(localPropsPath) && fs.existsSync(sdkDir)) {
        fs.writeFileSync(localPropsPath, `sdk.dir=${sdkDir}\n`);
      }
      return cfg;
    },
  ]);
};

const config: ExpoConfig = {
  name: '꽃 어디',
  slug: 'kkoteodi',
  version: '1.0.1',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/c4af274d-b7c9-4d43-a479-00e6ae4d1944',
  },
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
      'aps-environment': 'production',
    },
    infoPlist: {
      LSApplicationQueriesSchemes: ['nmap'],
      NSUserNotificationsUsageDescription: '주요 꽃 행사 소식을 알려드리기 위해 알림을 사용합니다.',
      NSLocationWhenInUseUsageDescription: '내 주변 꽃 명소를 찾기 위해 위치 정보를 사용합니다.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.kkoteodi.mobile',
    googleServicesFile: './google-services.json',
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
          compileSdkVersion: 36,
          targetSdkVersion: 35,
          minSdkVersion: 24,
          extraMavenRepos: ['https://repository.map.naver.com/archive/maven'],
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
        androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? '',
        iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? '',
      },
    ],
    withLocalProperties,
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
};

export default ({ config: baseConfig }: ConfigContext): ExpoConfig => ({
  ...baseConfig,
  ...config,
});
