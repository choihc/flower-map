import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';

import type { Stay } from '../../../shared/data/types';
import { BookingProviderSheet } from './BookingProviderSheet';
import { openAgodaHotel, openTripcomHotel } from '../lib/affiliateHotel';

vi.mock('../lib/affiliateHotel', () => ({
  openTripcomHotel: vi.fn(),
  openAgodaHotel: vi.fn(),
}));

function asEl(node: unknown): HTMLElement {
  return node as unknown as HTMLElement;
}

const stay: Stay = {
  id: 'stay-1', slug: 'hotel-naru', name: '호텔 나루',
  regionPrimary: '인천', regionSecondary: '중구', address: '인천 중구 어디로 1',
  latitude: 37.45, longitude: 126.63, stayType: 'city', seasonTags: [],
  seasonWindowStart: null, seasonWindowEnd: null, shortTagline: '', description: '',
  recommendationPoints: [], tripcomBookingUrl: 'https://kr.trip.com/x', agodaHotelId: '24180119',
  thumbnailUrl: null, bookingQueryOverride: null, naverRating: null, googleRating: null,
  ratingCapturedAt: null, isFeatured: false, displayOrder: 0,
};

describe('BookingProviderSheet', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('두 provider 행을 모두 렌더링한다', () => {
    const { getByTestId } = render(<BookingProviderSheet stay={stay} onClose={vi.fn()} />);
    expect(getByTestId('booking-sheet-tripcom')).toBeTruthy();
    expect(getByTestId('booking-sheet-agoda')).toBeTruthy();
  });

  it('trip.com 행 탭 시 openTripcomHotel과 onClose가 호출된다', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<BookingProviderSheet stay={stay} onClose={onClose} />);
    asEl(getByTestId('booking-sheet-tripcom')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(vi.mocked(openTripcomHotel)).toHaveBeenCalledWith({
      name: '호텔 나루', queryOverride: null, tripcomBookingUrl: 'https://kr.trip.com/x',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Agoda 행 탭 시 openAgodaHotel과 onClose가 호출된다', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<BookingProviderSheet stay={stay} onClose={onClose} />);
    asEl(getByTestId('booking-sheet-agoda')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(vi.mocked(openAgodaHotel)).toHaveBeenCalledWith({
      name: '호텔 나루', queryOverride: null, agodaHotelId: '24180119',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
