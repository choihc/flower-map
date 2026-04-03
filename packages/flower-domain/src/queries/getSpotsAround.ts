import { supabase } from '@flower-map/supabase';
import type { PublishedSpotRow } from '@flower-map/supabase';

import { mapSpotRow } from '../mappers/mapSpotRow';
import type { SpotSelectQuery } from '../types';

const SPOT_SELECT = '*, flower:flowers(name_ko, thumbnail_url)';
const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(
  originLatitude: number,
  originLongitude: number,
  targetLatitude: number,
  targetLongitude: number,
) {
  const latitudeDelta = toRadians(targetLatitude - originLatitude);
  const longitudeDelta = toRadians(targetLongitude - originLongitude);
  const startLatitude = toRadians(originLatitude);
  const endLatitude = toRadians(targetLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export async function getSpotsAround({
  latitude,
  longitude,
  radiusKm,
  limit,
}: SpotSelectQuery) {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  const spots = (data ?? [])
    .map((row) => {
      const typedRow = row as PublishedSpotRow;
      return {
        distanceKm: getDistanceKm(latitude, longitude, typedRow.latitude, typedRow.longitude),
        spot: mapSpotRow(typedRow),
      };
    })
    .filter(({ distanceKm }) => distanceKm <= radiusKm)
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .map(({ spot }) => spot);

  return limit ? spots.slice(0, limit) : spots;
}
