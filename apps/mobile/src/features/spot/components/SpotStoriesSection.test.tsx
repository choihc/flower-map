import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';

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

  it('blog.url이 javascript: 스킴이면 Linking.openURL을 호출하지 않는다', () => {
    const videos: any[] = [];
    const blogs = [
      {
        url: 'javascript:alert(1)',
        title: '악성 블로그',
        bloggerName: '해커',
        postedAt: new Date('2026-04-10T00:00:00Z'),
      },
    ];

    (useQuery as any).mockReturnValue({ data: { videos, blogs }, isLoading: false });

    const openURLSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { getByTestId } = render(<SpotStoriesSection slug="x" />);
    fireEvent.press(getByTestId('story-blog'));

    expect(openURLSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    openURLSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('blog.url이 https:// 스킴이면 Linking.openURL이 호출된다', () => {
    const videos: any[] = [];
    const blogs = [
      {
        url: 'https://example.com/post',
        title: '정상 블로그',
        bloggerName: '블로거',
        postedAt: new Date('2026-04-10T00:00:00Z'),
      },
    ];

    (useQuery as any).mockReturnValue({ data: { videos, blogs }, isLoading: false });

    const openURLSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

    const { getByTestId } = render(<SpotStoriesSection slug="x" />);
    fireEvent.press(getByTestId('story-blog'));

    expect(openURLSpy).toHaveBeenCalledWith('https://example.com/post');

    openURLSpy.mockRestore();
  });
});
