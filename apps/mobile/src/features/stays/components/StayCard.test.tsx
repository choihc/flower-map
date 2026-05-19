import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';

import type { Stay } from '../../../shared/data/types';
import { StayCard } from './StayCard';

function asEl(node: unknown): HTMLElement {
  return node as unknown as HTMLElement;
}

const baseStay: Stay = {
  id: 'stay-1',
  slug: 'hotel-naru',
  name: '호텔 나루',
  regionPrimary: '인천',
  regionSecondary: '중구',
  address: '인천 중구 어디로 1',
  latitude: 37.4513,
  longitude: 126.6312,
  stayType: 'city',
  seasonTags: ['루프탑', '오션뷰', '도심야경'],
  seasonWindowStart: null,
  seasonWindowEnd: null,
  shortTagline: '인천 앞바다와 야경을 동시에',
  description: '인천 앞바다와 야경을 동시에 누리는 도심 호텔이에요.',
  recommendationPoints: [],
  agodaHotelId: null,
  thumbnailUrl: null,
  bookingQueryOverride: null,
  naverRating: null,
  googleRating: null,
  ratingCapturedAt: null,
  isFeatured: true,
  displayOrder: 1,
};

describe('StayCard (가로형)', () => {
  it('호텔명·지역·태그를 렌더링한다', () => {
    const { getByText } = render(
      <StayCard stay={baseStay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(getByText('호텔 나루')).toBeTruthy();
    expect(getByText('인천 · 중구')).toBeTruthy();
    expect(getByText('루프탑')).toBeTruthy();
    expect(getByText('오션뷰')).toBeTruthy();
  });

  it('seasonTags는 최대 2개까지만 노출된다 (가로형 컴팩트 제약)', () => {
    const stay: Stay = { ...baseStay, seasonTags: ['t1', 't2', 't3', 't4'] };
    const { queryByText } = render(
      <StayCard stay={stay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByText('t1')).toBeTruthy();
    expect(queryByText('t2')).toBeTruthy();
    expect(queryByText('t3')).toBeNull();
  });

  it('seasonTags가 0개면 태그 영역이 미렌더', () => {
    const stay: Stay = { ...baseStay, seasonTags: [] };
    const { queryByTestId } = render(
      <StayCard stay={stay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByTestId('stay-card-tags')).toBeNull();
  });

  it('shortTagline은 가로형에서 더 이상 노출되지 않는다', () => {
    const { queryByText } = render(
      <StayCard stay={baseStay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByText('인천 앞바다와 야경을 동시에')).toBeNull();
  });

  it('길찾기 버튼이 더 이상 렌더되지 않는다', () => {
    const { queryByTestId } = render(
      <StayCard stay={baseStay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByTestId('stay-card-directions')).toBeNull();
  });

  it('두 평점이 모두 있으면 score가 높은 쪽이 표시된다', () => {
    const stay: Stay = {
      ...baseStay,
      naverRating: { score: 4.2, url: 'https://naver.com/x' },
      googleRating: { score: 4.8, url: 'https://google.com/x' },
    };
    const { getByTestId } = render(
      <StayCard stay={stay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    const text = asEl(getByTestId('stay-card-rating')).textContent ?? '';
    expect(text).toContain('4.8');
  });

  it('두 평점이 모두 NaN이면 평점 칩이 미렌더', () => {
    const stay: Stay = {
      ...baseStay,
      naverRating: { score: NaN, url: 'x' },
      googleRating: { score: NaN, url: 'x' },
    };
    const { queryByTestId } = render(
      <StayCard stay={stay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByTestId('stay-card-rating')).toBeNull();
  });

  it('boostBadge.label 전달 시 부스트 라인을 렌더한다', () => {
    const { getByText } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressBook={vi.fn()}
        boostBadge={{ label: '장미공원에서 5.6km' }}
      />,
    );
    // 카드 내부 렌더 텍스트는 "🌸 {label}" 형태이므로 정규식으로 부분 매칭한다.
    expect(getByText(/장미공원에서 5\.6km/)).toBeTruthy();
  });

  it('boostBadge가 null이면 부스트 라인을 미렌더', () => {
    const { queryByTestId } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressBook={vi.fn()}
        boostBadge={null}
      />,
    );
    expect(queryByTestId('stay-card-boost-badge')).toBeNull();
  });

  it('boostBadge.label이 빈 문자열이면 부스트 라인을 미렌더 (가드)', () => {
    const { queryByTestId } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressBook={vi.fn()}
        boostBadge={{ label: '' }}
      />,
    );
    expect(queryByTestId('stay-card-boost-badge')).toBeNull();
  });

  it('카드 전체 onPress 콜백이 호출된다', () => {
    const onPress = vi.fn();
    const { getByTestId } = render(
      <StayCard stay={baseStay} onPress={onPress} onPressBook={vi.fn()} />,
    );
    asEl(getByTestId('stay-card')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('예약 칩 탭 시 onPressBook이 호출된다', () => {
    const onPressBook = vi.fn();
    const { getByTestId } = render(
      <StayCard stay={baseStay} onPress={vi.fn()} onPressBook={onPressBook} />,
    );
    asEl(getByTestId('stay-card-book')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onPressBook).toHaveBeenCalledTimes(1);
  });
});
