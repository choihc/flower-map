import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));
vi.mock('../../../shared/data/spotRepository', () => ({
  spotKeys: { content: (slug: string) => ['spots', 'content', slug] },
  getSpotContent: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { SpotStoriesSection } from './SpotStoriesSection';

describe('SpotStoriesSection', () => {
  it('비디오 3개·블로그 5개가 주어지면 각각 렌더한다', () => {
    const videos = Array.from({ length: 3 }, (_, i) => ({
      videoId: `vid-${i}`,
      title: `영상 ${i}`,
      channelTitle: `채널 ${i}`,
      thumbnailUrl: `https://img/v-${i}.jpg`,
      publishedAt: new Date(`2026-04-${10 - i}T00:00:00Z`),
    }));
    const blogs = Array.from({ length: 5 }, (_, i) => ({
      url: `https://b${i}`,
      title: `블로그 ${i}`,
      bloggerName: `블로거 ${i}`,
      postedAt: new Date(`2026-04-${10 - i}T00:00:00Z`),
    }));

    (useQuery as any).mockReturnValue({ data: { videos, blogs }, isLoading: false });

    const { getAllByTestId, getByTestId } = render(<SpotStoriesSection slug="x" />);

    expect(getByTestId('spot-stories-section')).toBeTruthy();
    expect(getAllByTestId('story-video')).toHaveLength(3);
    expect(getAllByTestId('story-blog')).toHaveLength(5);
  });

  it('비디오·블로그가 모두 비어 있으면 섹션을 렌더하지 않는다', () => {
    (useQuery as any).mockReturnValue({ data: { videos: [], blogs: [] }, isLoading: false });

    const { queryByTestId } = render(<SpotStoriesSection slug="x" />);

    expect(queryByTestId('spot-stories-section')).toBeNull();
  });

  it('로딩 상태에서는 섹션을 숨긴다 (데이터 확정 전)', () => {
    (useQuery as any).mockReturnValue({ data: undefined, isLoading: true });

    const { queryByTestId } = render(<SpotStoriesSection slug="x" />);

    expect(queryByTestId('spot-stories-section')).toBeNull();
  });

  it("데이터가 있으면 sectionTitle='이 명소 이야기'와 testID='spot-stories-section'으로 렌더한다", () => {
    (useQuery as any).mockReturnValue({
      data: {
        videos: [
          {
            videoId: 'v1',
            title: '영상',
            channelTitle: '채널',
            thumbnailUrl: 'https://img/v.jpg',
            publishedAt: new Date('2026-04-10T00:00:00Z'),
          },
        ],
        blogs: [],
      },
      isLoading: false,
    });
    const { getByTestId, getByText } = render(<SpotStoriesSection slug="x" />);
    expect(getByTestId('spot-stories-section')).toBeTruthy();
    expect(getByText('이 명소 이야기')).toBeTruthy();
  });
});
