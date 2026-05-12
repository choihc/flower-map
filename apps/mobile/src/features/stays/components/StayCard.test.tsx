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
  thumbnailUrl: null,
  bookingQueryOverride: null,
  naverRating: null,
  googleRating: null,
  ratingCapturedAt: null,
  isFeatured: true,
  displayOrder: 1,
};

describe('StayCard', () => {
  it('호텔명, 지역, 태그 3개, shortTagline을 렌더링한다', () => {
    const { getByText } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );

    expect(getByText('호텔 나루')).toBeTruthy();
    expect(getByText('인천 · 중구')).toBeTruthy();
    expect(getByText('루프탑')).toBeTruthy();
    expect(getByText('오션뷰')).toBeTruthy();
    expect(getByText('도심야경')).toBeTruthy();
    expect(getByText('인천 앞바다와 야경을 동시에')).toBeTruthy();
  });

  it('seasonTags가 0개면 태그 영역이 렌더되지 않는다', () => {
    const stay: Stay = { ...baseStay, seasonTags: [] };
    const { queryByTestId } = render(
      <StayCard
        stay={stay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    expect(queryByTestId('stay-card-tags')).toBeNull();
  });

  it('seasonTags는 최대 3개까지만 렌더된다', () => {
    const stay: Stay = { ...baseStay, seasonTags: ['t1', 't2', 't3', 't4', 't5'] };
    const { queryByText } = render(
      <StayCard
        stay={stay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    expect(queryByText('t1')).toBeTruthy();
    expect(queryByText('t3')).toBeTruthy();
    expect(queryByText('t4')).toBeNull();
  });

  it('naverRating만 있으면 평점 칩에 ★와 점수가 표시된다', () => {
    const stay: Stay = {
      ...baseStay,
      naverRating: { score: 4.5, url: 'https://naver.com/x' },
    };
    const { getByTestId } = render(
      <StayCard
        stay={stay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    const chip = asEl(getByTestId('stay-card-rating'));
    expect(chip.textContent).toContain('★');
    expect(chip.textContent).toContain('4.5');
  });

  it('googleRating만 있어도 평점 칩이 렌더된다', () => {
    const stay: Stay = {
      ...baseStay,
      googleRating: { score: 4.7, url: 'https://google.com/x' },
    };
    const { getByTestId } = render(
      <StayCard
        stay={stay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    expect(asEl(getByTestId('stay-card-rating')).textContent).toContain('4.7');
  });

  it('두 평점이 모두 있으면 score가 더 높은 쪽이 표시된다', () => {
    const stay: Stay = {
      ...baseStay,
      naverRating: { score: 4.2, url: 'https://naver.com/x' },
      googleRating: { score: 4.8, url: 'https://google.com/x' },
    };
    const { getByTestId } = render(
      <StayCard
        stay={stay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    const text = asEl(getByTestId('stay-card-rating')).textContent ?? '';
    expect(text).toContain('4.8');
    expect(text).not.toContain('4.2');
  });

  it('naverRating.score가 NaN이면 googleRating으로 폴백된다', () => {
    const stay: Stay = {
      ...baseStay,
      naverRating: { score: NaN, url: 'https://naver.com/x' },
      googleRating: { score: 4.3, url: 'https://google.com/x' },
    };
    const { getByTestId } = render(
      <StayCard
        stay={stay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    expect(asEl(getByTestId('stay-card-rating')).textContent).toContain('4.3');
  });

  it('두 평점 score가 모두 NaN이면 평점 칩이 렌더되지 않는다', () => {
    const stay: Stay = {
      ...baseStay,
      naverRating: { score: NaN, url: 'https://naver.com/x' },
      googleRating: { score: NaN, url: 'https://google.com/x' },
    };
    const { queryByTestId } = render(
      <StayCard
        stay={stay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    expect(queryByTestId('stay-card-rating')).toBeNull();
  });

  it('두 평점이 모두 없으면 평점 칩이 렌더되지 않는다', () => {
    const { queryByTestId } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    expect(queryByTestId('stay-card-rating')).toBeNull();
  });

  it('directionsDisabled prop이 true면 길찾기 버튼이 disabled 처리되고 onPress는 부모로 위임된다', () => {
    const onPressDirections = vi.fn();
    const { getByTestId } = render(
      <StayCard
        stay={baseStay}
        directionsDisabled
        onPress={vi.fn()}
        onPressDirections={onPressDirections}
        onPressBook={vi.fn()}
      />,
    );
    const btn = asEl(getByTestId('stay-card-directions'));
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onPressDirections).toHaveBeenCalledTimes(1);
  });

  it('directionsDisabled prop이 없으면 길찾기 버튼이 활성화된다', () => {
    const { getByTestId } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    const btn = asEl(getByTestId('stay-card-directions'));
    expect(btn.getAttribute('aria-disabled')).toBe('false');
  });

  it('길찾기 / 예약 CTA onPress 콜백이 호출된다', () => {
    const onPressDirections = vi.fn();
    const onPressBook = vi.fn();
    const { getByTestId } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressDirections={onPressDirections}
        onPressBook={onPressBook}
      />,
    );
    asEl(getByTestId('stay-card-directions')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    asEl(getByTestId('stay-card-book')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onPressDirections).toHaveBeenCalledTimes(1);
    expect(onPressBook).toHaveBeenCalledTimes(1);
  });

  it('카드 전체 onPress 콜백이 호출된다', () => {
    const onPress = vi.fn();
    const { getByTestId } = render(
      <StayCard
        stay={baseStay}
        onPress={onPress}
        onPressDirections={vi.fn()}
        onPressBook={vi.fn()}
      />,
    );
    asEl(getByTestId('stay-card')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
