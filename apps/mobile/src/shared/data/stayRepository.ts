import { supabase } from '../lib/supabase';
import { toStay } from './stayMappers';
import type { Stay, StayBlog, StayVideo } from './types';

export const stayKeys = {
  all: ['stays'] as const,
  detail: (slug: string) => ['stays', slug] as const,
  content: (slug: string) => ['stays', 'content', slug] as const,
};

export async function getPublishedStays(): Promise<Stay[]> {
  const { data, error } = await supabase
    .from('stays')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => toStay(row as any));
}

export async function getPublishedStayBySlug(slug: string): Promise<Stay | undefined> {
  const { data, error } = await supabase
    .from('stays')
    .select('*')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toStay(data as any) : undefined;
}

type StayVideoRow = {
  video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
};

type StayBlogRow = {
  url: string;
  title: string;
  blogger_name: string | null;
  posted_at: string | null;
};

export async function getStayContent(
  slug: string,
): Promise<{ videos: StayVideo[]; blogs: StayBlog[] }> {
  const { data: stayRow, error: stayError } = await supabase
    .from('stays')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (stayError) throw stayError;
  if (!stayRow) return { videos: [], blogs: [] };

  const stayId = (stayRow as { id: string }).id;

  const [videoRes, blogRes] = await Promise.all([
    supabase
      .from('stay_videos')
      .select('video_id, title, channel_title, thumbnail_url, published_at')
      .eq('stay_id', stayId)
      .order('relevance_score', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(6),
    supabase
      .from('stay_blogs')
      .select('url, title, blogger_name, posted_at')
      .eq('stay_id', stayId)
      .order('relevance_score', { ascending: false, nullsFirst: false })
      .order('posted_at', { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  if (videoRes.error) throw videoRes.error;
  if (blogRes.error) throw blogRes.error;

  const videos: StayVideo[] = ((videoRes.data ?? []) as StayVideoRow[])
    .filter((row) => row.published_at != null)
    .slice(0, 6)
    .map((row) => ({
      videoId: row.video_id,
      title: row.title,
      channelTitle: row.channel_title ?? '',
      thumbnailUrl: row.thumbnail_url ?? '',
      publishedAt: new Date(row.published_at as string),
    }));

  const blogs: StayBlog[] = ((blogRes.data ?? []) as StayBlogRow[])
    .filter((row) => row.posted_at != null)
    .slice(0, 5)
    .map((row) => ({
      url: row.url,
      title: row.title,
      bloggerName: row.blogger_name ?? '',
      postedAt: new Date(row.posted_at as string),
    }));

  return { videos, blogs };
}
