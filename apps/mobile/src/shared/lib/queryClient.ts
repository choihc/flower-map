import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30분 (데이터 일 단위 갱신 — 상향)
      gcTime: 1000 * 60 * 60 * 24, // 24h — persist maxAge 이상이어야 복원 대상 유지
      retry: 2,
    },
  },
});
