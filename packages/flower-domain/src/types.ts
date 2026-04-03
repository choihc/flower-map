import type { FlowerSpot, PublishedSpotRow } from '@flower-map/supabase';

export type { FlowerSpot, PublishedSpotRow };

export type SpotSelectQuery = {
  latitude: number;
  longitude: number;
  radiusKm: number;
  limit?: number;
};

export type FlowerFilter = {
  label: string;
  value: string;
};
