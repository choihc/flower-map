import * as ExpoLocation from 'expo-location';

import type { FlowerSpot } from '../data/types';

export type Coords = { latitude: number; longitude: number };
export type NearbySpot = { spot: FlowerSpot; distanceKm: number };
export type LocationResult = Coords | 'denied' | null;
// Coords   = 위치 획득 성공
// 'denied' = 권한 거부
// null     = 기타 에러 (타임아웃 등)

export async function requestAndGetLocation(): Promise<LocationResult> {
  try {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') return 'denied';
    const position = await ExpoLocation.getCurrentPositionAsync({});
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const chord =
    sinDLat * sinDLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

export function getNearbySpots(
  spots: FlowerSpot[],
  userCoords: Coords,
  limit = 3,
): NearbySpot[] {
  return spots
    .map((spot) => ({
      spot,
      distanceKm: haversineKm(userCoords, { latitude: spot.latitude, longitude: spot.longitude }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function formatDistance(km: number): string {
  if (km < 1) {
    // 1km 미만은 m 단위로 반올림 (예: 0.9999km → "1000m", 1.0km는 아래 분기에서 처리)
    return `${Math.round(km * 1000)}m`;
  }
  const rounded = Math.round(km * 10) / 10;
  // 정수이면 소수점 없이 표시 (예: 1.0 → "1km"), 소수이면 그대로 (예: 1.3 → "1.3km")
  return rounded % 1 === 0 ? `${Math.round(rounded)}km` : `${rounded}km`;
}
