import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { StoriesSection } from './StoriesSection';
import type { SpotBlog, SpotVideo } from '../data/types';

function makeVideos(count: number): SpotVideo[] {
  return Array.from({ length: count }, (_, i) => ({
    videoId: `vid-${i}`,
    title: `영상 ${i}`,
    channelTitle: `채널 ${i}`,
    thumbnailUrl: `https://img/v-${i}.jpg`,
    publishedAt: new Date(`2026-04-${10 - i}T00:00:00Z`),
  }));
}

function makeBlogs(specs: Array<Partial<SpotBlog>>): SpotBlog[] {
  return specs.map((spec, i) => ({
    url: spec.url ?? `https://b${i}`,
    title: spec.title ?? `블로그 ${i}`,
    bloggerName: spec.bloggerName ?? `블로거 ${i}`,
    postedAt: spec.postedAt ?? new Date(`2026-04-${10 - i}T00:00:00Z`),
  }));
}

describe('StoriesSection', () => {
  it('비디오 3개·블로그 5개가 주어지면 각각 렌더한다', () => {
    const videos = makeVideos(3);
    const blogs = makeBlogs(
      Array.from({ length: 5 }, (_, i) => ({ url: `https://blog.naver.com/b/${i}` })),
    );

    const { getAllByTestId } = render(
      <StoriesSection videos={videos} blogs={blogs} sectionTitle="이 명소 이야기" />,
    );

    expect(getAllByTestId('story-video')).toHaveLength(3);
    expect(getAllByTestId('story-blog')).toHaveLength(5);
  });

  it('비디오·블로그가 모두 비어 있으면 null을 리턴한다', () => {
    const { queryByTestId } = render(
      <StoriesSection videos={[]} blogs={[]} sectionTitle="이 명소 이야기" />,
    );
    expect(queryByTestId('stories-section')).toBeNull();
  });

  it('blog.url이 javascript: 스킴이면 Linking.openURL을 호출하지 않는다', () => {
    const blogs = makeBlogs([{ url: 'javascript:alert(1)' }]);
    const openURLSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { getByTestId } = render(
      <StoriesSection videos={[]} blogs={blogs} sectionTitle="이 명소 이야기" />,
    );
    fireEvent.press(getByTestId('story-blog'));

    expect(openURLSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    openURLSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('blog.url이 허용 호스트(blog.naver.com)이면 Linking.openURL이 호출된다', () => {
    const blogs = makeBlogs([{ url: 'https://blog.naver.com/tester/post' }]);
    const openURLSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

    const { getByTestId } = render(
      <StoriesSection videos={[]} blogs={blogs} sectionTitle="이 명소 이야기" />,
    );
    fireEvent.press(getByTestId('story-blog'));

    expect(openURLSpy).toHaveBeenCalledWith('https://blog.naver.com/tester/post');

    openURLSpy.mockRestore();
  });

  it('blog.url이 허용되지 않은 호스트(evil.example.com)면 Linking.openURL을 호출하지 않는다', () => {
    const blogs = makeBlogs([{ url: 'http://evil.example.com/x' }]);
    const openURLSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { getByTestId } = render(
      <StoriesSection videos={[]} blogs={blogs} sectionTitle="이 명소 이야기" />,
    );
    fireEvent.press(getByTestId('story-blog'));

    expect(openURLSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    openURLSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('tistory 서브도메인 blog.url은 허용된다', () => {
    const blogs = makeBlogs([{ url: 'https://foo.tistory.com/123' }]);
    const openURLSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

    const { getByTestId } = render(
      <StoriesSection videos={[]} blogs={blogs} sectionTitle="이 명소 이야기" />,
    );
    fireEvent.press(getByTestId('story-blog'));

    expect(openURLSpy).toHaveBeenCalledWith('https://foo.tistory.com/123');

    openURLSpy.mockRestore();
  });

  it('sectionTitle prop이 주어지면 그 문자열이 노출된다', () => {
    const blogs = makeBlogs([{ url: 'https://blog.naver.com/x' }]);

    const { getByText } = render(
      <StoriesSection videos={[]} blogs={blogs} sectionTitle="이 호텔 이야기" />,
    );

    expect(getByText('이 호텔 이야기')).toBeTruthy();
  });

  it('testID prop이 주어지면 그 값으로 테스트 ID가 설정된다', () => {
    const blogs = makeBlogs([{ url: 'https://blog.naver.com/x' }]);

    const { getByTestId } = render(
      <StoriesSection
        videos={[]}
        blogs={blogs}
        sectionTitle="이 명소 이야기"
        testID="hokance-stories"
      />,
    );

    expect(getByTestId('hokance-stories')).toBeTruthy();
  });
});
