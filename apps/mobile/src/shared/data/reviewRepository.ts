import { supabase } from '../lib/supabase';

export type Review = {
  id: string;
  spotId: string;
  userId: string;
  content: string;
  createdAt: string;
};

type ReviewRow = {
  id: string;
  spot_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    spotId: row.spot_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

export const reviewKeys = {
  bySpot: (spotId: string) => ['reviews', spotId] as const,
};

export async function getReviewsBySpotId(spotId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('spot_reviews')
    .select('*')
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toReview(row as ReviewRow));
}

export async function createReview(spotId: string, userId: string, content: string): Promise<Review> {
  const { data, error } = await supabase
    .from('spot_reviews')
    .insert({ spot_id: spotId, user_id: userId, content })
    .select()
    .single();

  if (error) throw error;
  return toReview(data as ReviewRow);
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('spot_reviews').delete().eq('id', reviewId);
  if (error) throw error;
}
