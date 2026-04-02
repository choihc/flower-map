import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

export async function isSpotLiked(spotId: string): Promise<boolean> {
  const deviceId = await getDeviceId();
  const { count } = await supabase
    .from('spot_likes')
    .select('*', { count: 'exact', head: true })
    .eq('spot_id', spotId)
    .eq('device_id', deviceId);
  return (count ?? 0) > 0;
}

export async function toggleSpotLike(spotId: string): Promise<boolean> {
  const deviceId = await getDeviceId();
  const liked = await isSpotLiked(spotId);

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

export async function getAllLikedIds(): Promise<string[]> {
  const deviceId = await getDeviceId();
  const { data } = await supabase
    .from('spot_likes')
    .select('spot_id')
    .eq('device_id', deviceId);
  return (data ?? []).map((row) => row.spot_id);
}
