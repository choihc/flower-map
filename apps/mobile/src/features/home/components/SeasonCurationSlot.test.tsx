import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react-native';

const push = vi.fn();
vi.mock('expo-router', () => ({
  useRouter: () => ({ push }),
}));

import { SeasonCurationSlot } from './SeasonCurationSlot';
import type { HomeCurationSlot } from '../../../shared/data/types';

const baseSlot: HomeCurationSlot = {
  id: 'slot-1',
  slotKey: 'hocance-weekend',
  title: '이번 주말, 호캉스 어디 갈까?',
  subtitle: '꽃 시즌 사이, 도심 속 휴식 10곳',
  ctaRoute: '/stays',
  ctaLabel: '호캉스 보기 →',
  coverImageUrl: null,
  isActive: true,
  displayOrder: 0,
};

describe('SeasonCurationSlot', () => {
  it('제목·부제·CTA 라벨·고정 배지를 렌더한다', () => {
    const { getByText } = render(<SeasonCurationSlot slot={baseSlot} />);
    expect(getByText('시즌 큐레이션')).toBeTruthy();
    expect(getByText('이번 주말, 호캉스 어디 갈까?')).toBeTruthy();
    expect(getByText('꽃 시즌 사이, 도심 속 휴식 10곳')).toBeTruthy();
    expect(getByText('호캉스 보기 →')).toBeTruthy();
  });

  it('subtitle이 null이면 부제 라인이 렌더되지 않는다', () => {
    const { queryByText } = render(
      <SeasonCurationSlot slot={{ ...baseSlot, subtitle: null }} />,
    );
    expect(queryByText('꽃 시즌 사이, 도심 속 휴식 10곳')).toBeNull();
  });

  it('내부 라우트 cta_route이면 클릭 시 router.push 호출', () => {
    push.mockClear();
    const { getByTestId } = render(<SeasonCurationSlot slot={baseSlot} />);
    fireEvent.press(getByTestId('season-curation-slot'));
    expect(push).toHaveBeenCalledWith('/stays');
  });

  it('외부 URL cta_route은 router.push 차단', () => {
    push.mockClear();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByTestId } = render(
      <SeasonCurationSlot slot={{ ...baseSlot, ctaRoute: 'https://evil.com' }} />,
    );
    fireEvent.press(getByTestId('season-curation-slot'));
    expect(push).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('스킴 인젝션 cta_route은 router.push 차단', () => {
    push.mockClear();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByTestId } = render(
      <SeasonCurationSlot slot={{ ...baseSlot, ctaRoute: 'javascript:alert(1)' }} />,
    );
    fireEvent.press(getByTestId('season-curation-slot'));
    expect(push).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
