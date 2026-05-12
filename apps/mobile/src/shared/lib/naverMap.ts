import { Linking, Platform } from 'react-native';

import { isValidCoordinate } from './coordinate';

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

export function buildNaverMapPlaceUrl(query: string): string {
  return `https://map.naver.com/p/search/${encode(query)}`;
}

export async function openNaverMapPlace(query: string): Promise<boolean> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return false;
  try {
    await Linking.openURL(buildNaverMapPlaceUrl(trimmed));
    return true;
  } catch {
    return false;
  }
}

export async function openNaverNavigation({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}): Promise<boolean> {
  if (!isValidCoordinate(latitude, longitude)) {
    return false;
  }

  const navigationUrl = buildNaverNavigationUrl({ latitude, longitude, name });
  const fallbackUrl = Platform.OS === 'ios' ? iosStoreUrl : androidStoreUrl;

  try {
    if (await Linking.canOpenURL(navigationUrl)) {
      await Linking.openURL(navigationUrl);
      return true;
    }
    await Linking.openURL(fallbackUrl);
    return true;
  } catch {
    return false;
  }
}

export const DIRECTIONS_DISABLED_MESSAGE = '지도 정보 준비 중이에요';
