export interface VideoItem {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: Date;
  viewCount: number;
  thumbnailUrl: string;
  relevanceScore?: number;
}

export interface BlogItem {
  url: string;
  title: string;
  description: string;
  bloggerName: string;
  postedAt: Date;
  relevanceScore?: number;
}

export interface SpotContext {
  name: string;
  flower: string;
  aliases: string[];
  excludeKeywords: string[];
}

const VIDEO_MIN_VIEW_COUNT = 1000;
const VIDEO_MAX_RESULTS = 3;
const BLOG_MAX_RESULTS = 5;
const BLOG_FRESHNESS_DAYS = 365;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;
const RELEVANCE_BASE = 0.5;
const RELEVANCE_FLOWER_BONUS = 0.2;

function containsAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((k) => k && text.includes(k));
}

function computeRelevance(text: string, spot: SpotContext): number {
  const flowerTerms = [spot.flower, ...spot.aliases];
  const hasFlower = containsAny(text, flowerTerms);
  return hasFlower ? RELEVANCE_BASE + RELEVANCE_FLOWER_BONUS : RELEVANCE_BASE;
}

function dedupeByLatest<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  dateOf: (item: T) => Date,
): T[] {
  const latestByKey = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    const existing = latestByKey.get(key);
    if (!existing || dateOf(item).getTime() > dateOf(existing).getTime()) {
      latestByKey.set(key, item);
    }
  }
  return Array.from(latestByKey.values());
}

export function filterVideos(items: readonly VideoItem[], spot: SpotContext): VideoItem[] {
  const scored: VideoItem[] = [];

  for (const item of items) {
    const text = `${item.title} ${item.description}`;

    if (!text.includes(spot.name)) continue;
    if (containsAny(text, spot.excludeKeywords)) continue;
    if (item.viewCount < VIDEO_MIN_VIEW_COUNT) continue;

    scored.push({
      ...item,
      relevanceScore: computeRelevance(text, spot),
    });
  }

  const deduped = dedupeByLatest(
    scored,
    (v) => v.channelId,
    (v) => v.publishedAt,
  );

  deduped.sort((a, b) => {
    const scoreDiff = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return b.publishedAt.getTime() - a.publishedAt.getTime();
  });

  return deduped.slice(0, VIDEO_MAX_RESULTS);
}

export function filterBlogs(
  items: readonly BlogItem[],
  spot: SpotContext,
  now: Date = new Date(),
): BlogItem[] {
  const freshnessCutoff = now.getTime() - BLOG_FRESHNESS_DAYS * MILLIS_PER_DAY;
  const scored: BlogItem[] = [];

  for (const item of items) {
    if (!item.title.includes(spot.name)) continue;

    const text = `${item.title} ${item.description}`;
    if (containsAny(text, spot.excludeKeywords)) continue;

    if (item.postedAt.getTime() < freshnessCutoff) continue;

    scored.push({
      ...item,
      relevanceScore: computeRelevance(text, spot),
    });
  }

  const deduped = dedupeByLatest(
    scored,
    (b) => b.bloggerName,
    (b) => b.postedAt,
  );

  deduped.sort((a, b) => {
    const scoreDiff = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return b.postedAt.getTime() - a.postedAt.getTime();
  });

  return deduped.slice(0, BLOG_MAX_RESULTS);
}
