export interface BlogItem {
  title: string;
  link: string;
  description: string;
  bloggerName: string;
  postedAt: Date;
}

interface NaverBlogItem {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  postdate: string;
}

interface NaverBlogResponse {
  items?: NaverBlogItem[];
}

const BLOG_ENDPOINT = 'https://openapi.naver.com/v1/search/blog.json';

const HTML_ENTITY_MAP: Record<string, string> = {
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&#39;': "'",
  '&nbsp;': ' ',
};

function decodeHtmlEntities(value: string): string {
  return value.replace(
    /&(quot|amp|lt|gt|#39|nbsp);/g,
    (match) => HTML_ENTITY_MAP[match] ?? match,
  );
}

function stripBoldTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<\/?b>/gi, ''));
}

function parsePostDate(postdate: string): Date | null {
  if (typeof postdate !== 'string' || postdate.length < 8) return null;
  const year = Number.parseInt(postdate.slice(0, 4), 10);
  const month = Number.parseInt(postdate.slice(4, 6), 10);
  const day = Number.parseInt(postdate.slice(6, 8), 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const d = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function searchBlogs(args: {
  clientId: string;
  clientSecret: string;
  query: string;
  sort?: 'sim' | 'date';
  display?: number;
}): Promise<BlogItem[]> {
  const { clientId, clientSecret, query, sort = 'sim', display = 10 } = args;

  const params = new URLSearchParams({
    query,
    display: display.toString(),
    sort,
  });

  const response = await fetch(`${BLOG_ENDPOINT}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Naver blog search request failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as NaverBlogResponse;
  const items = payload.items ?? [];

  const mapped: BlogItem[] = [];
  for (const item of items) {
    const postedAt = parsePostDate(item.postdate);
    if (!postedAt) continue;
    mapped.push({
      title: stripBoldTags(item.title),
      link: item.link,
      description: stripBoldTags(item.description),
      bloggerName: item.bloggername,
      postedAt,
    });
  }
  return mapped;
}
