// src/shared/ui/SearchResultCard.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';
import { SearchResultCard } from './SearchResultCard';
import type { FlowerSpot } from '../data/types';

const baseSpot: FlowerSpot = {
  id: 'spot-1',
  slug: 'yeouido',
  place: '여의도 한강공원',
  flower: '벚꽃',
  location: '서울 영등포구',
  helper: '한강변 벚꽃 산책',
  bloomStatus: '개화 중',
  badge: '지금 방문 추천',
  thumbnailUrl: null,
  flowerThumbnailUrl: null,
  tone: 'pink',
  bloomStartAt: '2026-03-28',
  bloomEndAt: '2026-04-10',
  description: '서울 대표 벚꽃 명소',
  eventEndsIn: undefined,
  fee: '무료',
  festivalDate: '2026.03.28 - 2026.04.10',
  latitude: 37.528,
  longitude: 126.929,
  parking: '인근 공영주차장',
};

describe('SearchResultCard', () => {
  it('명소명, 꽃·지역, bloomStatus 뱃지를 렌더링한다', () => {
    const { getByText } = render(
      <SearchResultCard spot={baseSpot} onPress={vi.fn()} />
    );

    expect(getByText('여의도 한강공원')).toBeTruthy();
    expect(getByText('벚꽃 · 서울 영등포구')).toBeTruthy();
    expect(getByText('개화 중')).toBeTruthy();
  });

  it('onPress가 카드 탭 시 호출된다', () => {
    const onPress = vi.fn();
    const { getByText } = render(
      <SearchResultCard spot={baseSpot} onPress={onPress} />
    );
    // Pressable mock은 <pressable onClick={onPress}>으로 렌더링됨
    getByText('여의도 한강공원').closest('pressable')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('개화 종료 spot은 회색 뱃지를 렌더링한다', () => {
    const ended = { ...baseSpot, bloomStatus: '개화 종료' };
    const { getByText } = render(
      <SearchResultCard spot={ended} onPress={vi.fn()} />
    );
    expect(getByText('개화 종료')).toBeTruthy();
  });

  it('thumbnailUrl과 flowerThumbnailUrl 모두 없으면 BloomArt fallback을 렌더링한다', () => {
    const noImage = { ...baseSpot, thumbnailUrl: null, flowerThumbnailUrl: null };
    const { queryByTestId } = render(
      <SearchResultCard spot={noImage} onPress={vi.fn()} />
    );
    // Image가 없으면 fallback View가 렌더링된 것
    expect(queryByTestId('spot-thumbnail-image')).toBeNull();
  });

  it('thumbnailUrl이 없고 flowerThumbnailUrl이 있으면 flowerThumbnailUrl로 이미지를 렌더링한다', () => {
    const flowerOnly = { ...baseSpot, thumbnailUrl: null, flowerThumbnailUrl: 'https://example.com/flower.jpg' };
    const { getByTestId } = render(
      <SearchResultCard spot={flowerOnly} onPress={vi.fn()} />
    );
    expect(getByTestId('spot-thumbnail-image')).toBeTruthy();
  });
});
