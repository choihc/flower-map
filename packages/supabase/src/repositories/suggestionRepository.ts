import { supabase } from '../client';

export type SpotSuggestion = {
  name: string;
  address?: string;
  description?: string;
};

/**
 * deviceId는 호출 측(앱)에서 주입합니다.
 * Expo 환경이라면 expo-device 또는 자체 UUID 로직으로,
 * 일반 웹/Node 환경이라면 localStorage 등을 활용하세요.
 */
export async function submitSpotSuggestion(suggestion: SpotSuggestion, deviceId: string): Promise<void> {
  const { error } = await supabase.from('spot_suggestions').insert({
    name: suggestion.name,
    address: suggestion.address || null,
    description: suggestion.description || null,
    device_id: deviceId,
  });
  if (error) throw error;
}
