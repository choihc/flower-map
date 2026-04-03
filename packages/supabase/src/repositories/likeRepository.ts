import { supabase } from '../client';

/**
 * deviceId는 호출 측(앱)에서 주입합니다.
 * Expo 환경이라면 expo-device 또는 자체 UUID 로직으로,
 * 일반 웹/Node 환경이라면 localStorage 등을 활용하세요.
 */

export async function isSpotLiked(spotId: string, deviceId: string): Promise<boolean> {
  const { count } = await supabase
    .from('spot_likes')
    .select('*', { count: 'exact', head: true })
    .eq('spot_id', spotId)
    .eq('device_id', deviceId);
  return (count ?? 0) > 0;
}

export async function toggleSpotLike(spotId: string, deviceId: string): Promise<boolean> {
  const liked = await isSpotLiked(spotId, deviceId);

  if (liked) {
    await supabase
      .from('spot_likes')
      .delete()
      .eq('spot_id', spotId)
      .eq('device_id', deviceId);
    return false;
  }

  await supabase
    .from('spot_likes')
    .insert({ spot_id: spotId, device_id: deviceId });
  return true;
}

export async function getSpotLikeCount(spotId: string): Promise<number> {
  const { count } = await supabase
    .from('spot_likes')
    .select('*', { count: 'exact', head: true })
    .eq('spot_id', spotId);
  return count ?? 0;
}

export async function getAllLikedIds(deviceId: string): Promise<string[]> {
  const { data } = await supabase
    .from('spot_likes')
    .select('spot_id')
    .eq('device_id', deviceId);
  return (data ?? []).map((row) => row.spot_id);
}
