import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

type SpotSuggestion = {
  name: string;
  address?: string;
  description?: string;
};

export async function submitSpotSuggestion(suggestion: SpotSuggestion): Promise<void> {
  const deviceId = await getDeviceId();
  const { error } = await supabase.from('spot_suggestions').insert({
    name: suggestion.name,
    address: suggestion.address || null,
    description: suggestion.description || null,
    device_id: deviceId,
  });
  if (error) throw error;
}
