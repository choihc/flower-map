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

const VIDEO_MIN_VIEW_COUNT = 300;
const VIDEO_MAX_RESULTS = 3;
const BLOG_MAX_RESULTS = 5;
const BLOG_FRESHNESS_DAYS = 365;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;
const RELEVANCE_BASE = 0.5;
const RELEVANCE_FLOWER_BONUS = 0.2;

export const ALLOWED_BLOG_HOSTS = [
  'blog.naver.com',
  'm.blog.naver.com',
  'post.naver.com',
  'tistory.com',
  'brunch.co.kr',
] as const;

export function isAllowedBlogUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  for (const allowed of ALLOWED_BLOG_HOSTS) {
    if (host === allowed) return true;
    if (allowed === 'tistory.com' && host.endsWith('.tistory.com')) {
      return true;
    }
  }
  return false;
}

// 공백/전각공백을 제거해 표기 차이를 흡수한 포함 검사.
// 예) "여의도 윤중로" ↔ "여의도윤중로" / "여의도 　 윤중로" 모두 매칭.
function normalizeForMatch(value: string): string {
  return value.replace(/\s+/g, '').replace(/\u3000+/g, '');
}

function includesNormalized(text: string, needle: string): boolean {
  const n = normalizeForMatch(needle);
  if (n.length === 0) return false;
  return normalizeForMatch(text).includes(n);
}

// 명소명을 토큰(단어) 기반으로 매칭한다. 유튜버·블로거는 공식명 전체를 쓰지 않고
// 핵심 토큰만 쓰는 경우가 많기 때문에, 절반 이상(ceil(t/2)) 토큰이 등장하면 통과.
// 괄호 내용(예: "매헌시민의숲 (양재 시민의숲)")은 별칭으로 분리해 본명/별칭 중
// 어느 한쪽만 매칭되어도 인정한다.
function tokenizeName(part: string): string[] {
  return part
    .split(/[\s·,\-/·]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export function matchSpotName(text: string, spotName: string): boolean {
  const normText = normalizeForMatch(text);

  const aliases: string[] = [];
  const parenRe = /\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = parenRe.exec(spotName)) !== null) {
    aliases.push(m[1].trim());
  }
  const main = spotName.replace(/\([^)]*\)/g, '').trim();
  const variants = [main, ...aliases].filter((s) => s.length > 0);

  for (const variant of variants) {
    const tokens = tokenizeName(variant);
    if (tokens.length === 0) continue;
    const required = Math.max(1, Math.ceil(tokens.length / 2));
    let hit = 0;
    for (const t of tokens) {
      if (normText.includes(normalizeForMatch(t))) hit++;
      if (hit >= required) return true;
    }
  }
  return false;
}

function containsAny(text: string, keywords: readonly string[]): boolean {
  const normalizedText = text.toLowerCase();
  return keywords.some((k) => {
    if (typeof k !== 'string') return false;
    // 빈 문자열과 전각공백(U+3000)만 포함된 키워드는 무의미하므로 제외
    const trimmed = k.replace(/\u3000/g, '').trim();
    if (trimmed.length === 0) return false;
    return normalizedText.includes(trimmed.toLowerCase());
  });
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

export interface VideoFilterStats {
  input: number;
  rejectedNoNameMatch: number;
  rejectedExcludeKeyword: number;
  rejectedLowViewCount: number;
  rejectedDuplicateChannel: number;
  trimmedToMax: number;
  output: number;
}

export function filterVideosWithStats(
  items: readonly VideoItem[],
  spot: SpotContext,
): { filtered: VideoItem[]; stats: VideoFilterStats } {
  const stats: VideoFilterStats = {
    input: items.length,
    rejectedNoNameMatch: 0,
    rejectedExcludeKeyword: 0,
    rejectedLowViewCount: 0,
    rejectedDuplicateChannel: 0,
    trimmedToMax: 0,
    output: 0,
  };
  const scored: VideoItem[] = [];

  for (const item of items) {
    const text = `${item.title} ${item.description}`;

    if (!matchSpotName(text, spot.name)) {
      stats.rejectedNoNameMatch++;
      continue;
    }
    if (containsAny(text, spot.excludeKeywords)) {
      stats.rejectedExcludeKeyword++;
      continue;
    }
    if (item.viewCount < VIDEO_MIN_VIEW_COUNT) {
      stats.rejectedLowViewCount++;
      continue;
    }

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
  stats.rejectedDuplicateChannel = scored.length - deduped.length;

  deduped.sort((a, b) => {
    const scoreDiff = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return b.publishedAt.getTime() - a.publishedAt.getTime();
  });

  const filtered = deduped.slice(0, VIDEO_MAX_RESULTS);
  stats.trimmedToMax = deduped.length - filtered.length;
  stats.output = filtered.length;

  return { filtered, stats };
}

export function filterVideos(items: readonly VideoItem[], spot: SpotContext): VideoItem[] {
  return filterVideosWithStats(items, spot).filtered;
}

export interface BlogFilterStats {
  input: number;
  rejectedHost: number;
  rejectedNoNameMatch: number;
  rejectedExcludeKeyword: number;
  rejectedStale: number;
  rejectedDuplicateBlogger: number;
  trimmedToMax: number;
  output: number;
}

export function filterBlogsWithStats(
  items: readonly BlogItem[],
  spot: SpotContext,
  now: Date = new Date(),
): { filtered: BlogItem[]; stats: BlogFilterStats } {
  const stats: BlogFilterStats = {
    input: items.length,
    rejectedHost: 0,
    rejectedNoNameMatch: 0,
    rejectedExcludeKeyword: 0,
    rejectedStale: 0,
    rejectedDuplicateBlogger: 0,
    trimmedToMax: 0,
    output: 0,
  };
  const freshnessCutoff = now.getTime() - BLOG_FRESHNESS_DAYS * MILLIS_PER_DAY;
  const scored: BlogItem[] = [];

  for (const item of items) {
    if (!isAllowedBlogUrl(item.url)) {
      stats.rejectedHost++;
      continue;
    }
    if (!matchSpotName(item.title, spot.name)) {
      stats.rejectedNoNameMatch++;
      continue;
    }

    const text = `${item.title} ${item.description}`;
    if (containsAny(text, spot.excludeKeywords)) {
      stats.rejectedExcludeKeyword++;
      continue;
    }

    if (item.postedAt.getTime() < freshnessCutoff) {
      stats.rejectedStale++;
      continue;
    }

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
  stats.rejectedDuplicateBlogger = scored.length - deduped.length;

  deduped.sort((a, b) => {
    const scoreDiff = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return b.postedAt.getTime() - a.postedAt.getTime();
  });

  const filtered = deduped.slice(0, BLOG_MAX_RESULTS);
  stats.trimmedToMax = deduped.length - filtered.length;
  stats.output = filtered.length;
  return { filtered, stats };
}

export function filterBlogs(
  items: readonly BlogItem[],
  spot: SpotContext,
  now: Date = new Date(),
): BlogItem[] {
  return filterBlogsWithStats(items, spot, now).filtered;
}
