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

function stripBoldTags(value: string): string {
  return value.replace(/<\/?b>/gi, '');
}

function parsePostDate(postdate: string): Date {
  const year = Number.parseInt(postdate.slice(0, 4), 10);
  const month = Number.parseInt(postdate.slice(4, 6), 10);
  const day = Number.parseInt(postdate.slice(6, 8), 10);
  return new Date(Date.UTC(year, month - 1, day));
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

  return items.map((item) => ({
    title: stripBoldTags(item.title),
    link: item.link,
    description: stripBoldTags(item.description),
    bloggerName: item.bloggername,
    postedAt: parsePostDate(item.postdate),
  }));
}
