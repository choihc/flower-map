import { Linking, Platform } from 'react-native';

const appName = 'com.kkoteodi.mobile';
const iosStoreUrl = 'http://itunes.apple.com/app/id311867728?mt=8';
const androidStoreUrl = 'market://details?id=com.nhn.android.nmap';

function encode(value: string) {
  return encodeURIComponent(value);
}

export function buildNaverNavigationUrl({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  return [
    'nmap://route/car',
    `?dlat=${latitude}`,
    `&dlng=${longitude}`,
    `&dname=${encode(name)}`,
    `&appname=${encode(appName)}`,
  ].join('');
}

export async function openNaverNavigation({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const navigationUrl = buildNaverNavigationUrl({ latitude, longitude, name });
  const fallbackUrl = Platform.OS === 'ios' ? iosStoreUrl : androidStoreUrl;

  if (await Linking.canOpenURL(navigationUrl)) {
    await Linking.openURL(navigationUrl);
    return;
  }

  await Linking.openURL(fallbackUrl);
}
