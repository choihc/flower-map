// src/features/search/screens/SearchScreen.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchScreen } from './SearchScreen';

// React Query와 expo-router mock
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
// Supabase 환경변수 에러 방지를 위해 spotRepository mock
vi.mock('../../../shared/data/spotRepository', () => ({
  spotKeys: { all: ['spots'] },
  getPublishedSpots: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';

const mockSpots = [
  {
    id: '1', slug: 'yeouido', place: '여의도 한강공원', flower: '벚꽃',
    location: '서울 영등포구', helper: '한강변 산책', bloomStatus: '개화 중',
    badge: '지금 방문 추천', thumbnailUrl: null, flowerThumbnailUrl: null,
    tone: 'pink', bloomStartAt: '2026-03-28', bloomEndAt: '2026-04-10',
    description: '서울 대표 벚꽃', eventEndsIn: undefined,
    fee: '무료', festivalDate: '', latitude: 37.5, longitude: 126.9, parking: '',
  },
  {
    id: '2', slug: 'jeju', place: '제주 유채꽃 프라자', flower: '유채꽃',
    location: '제주 서귀포시', helper: '드넓은 유채꽃', bloomStatus: '개화 중',
    badge: '지금 방문 추천', thumbnailUrl: null, flowerThumbnailUrl: null,
    tone: 'yellow', bloomStartAt: '2026-03-01', bloomEndAt: '2026-04-30',
    description: '제주 유채꽃', eventEndsIn: undefined,
    fee: '유료', festivalDate: '', latitude: 33.3, longitude: 126.5, parking: '',
  },
];

describe('SearchScreen', () => {
  it('검색어가 없을 때 초기 안내 문구를 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: mockSpots, isLoading: false, isError: false });
    const { getByText } = render(<SearchScreen />);
    expect(getByText('꽃 이름, 명소 이름, 지역으로 검색해보세요')).toBeTruthy();
  });

  it('isLoading이면 스켈레톤을 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: [], isLoading: true, isError: false });
    const { getAllByTestId } = render(<SearchScreen />);
    expect(getAllByTestId('skeleton-box').length).toBeGreaterThan(0);
  });

  it('isError면 에러 메시지를 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: [], isLoading: false, isError: true });
    const { getByText } = render(<SearchScreen />);
    expect(getByText('데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')).toBeTruthy();
  });

  it('검색어 "벚꽃" 입력 시 관련 명소만 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: mockSpots, isLoading: false, isError: false });
    const { getByPlaceholderText, getByText, queryByText } = render(<SearchScreen />);

    fireEvent.changeText(getByPlaceholderText('꽃 이름, 명소, 지역으로 검색'), '벚꽃');

    expect(getByText('여의도 한강공원')).toBeTruthy();
    expect(queryByText('제주 유채꽃 프라자')).toBeNull();
    expect(getByText('1곳의 명소를 찾았어요')).toBeTruthy();
  });

  it('검색 결과가 없으면 "검색 결과가 없어요"를 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: mockSpots, isLoading: false, isError: false });
    const { getByPlaceholderText, getByText } = render(<SearchScreen />);

    fireEvent.changeText(getByPlaceholderText('꽃 이름, 명소, 지역으로 검색'), '존재하지않는명소');

    expect(getByText('검색 결과가 없어요')).toBeTruthy();
  });
});
