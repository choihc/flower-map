import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  getActiveHomeCurationSlots,
  homeCurationKeys,
} from '../../../shared/data/homeCurationRepository';
import { getPublishedSpots, getTopSpots, spotKeys } from '../../../shared/data/spotRepository';
import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';

export const HOME_SKELETON_TIMEOUT_MS = 5000;

const HOME_STATIC_STALE_MS = 1000 * 60 * 30;
const TOP_COUNT = 10;

type UseHomeReadyOptions = { timeoutMs?: number };
type UseHomeReadyResult = { ready: boolean };

/**
 * 홈 핵심 4개 쿼리를 섹션과 동일 키/함수/staleTime으로 관찰해 "노출 준비됨" 여부를 판정한다.
 * ready = (4개 쿼리 모두 settled) OR (timeoutMs 경과). settled = status !== 'pending'(성공 또는 에러).
 * 섹션들이 같은 키를 재사용하므로 캐시가 공유되어 중복 요청이 없고, 준비 후 섹션은 즉시 렌더된다.
 */
export function useHomeReady(options?: UseHomeReadyOptions): UseHomeReadyResult {
  const timeoutMs = options?.timeoutMs ?? HOME_SKELETON_TIMEOUT_MS;

  const spots = useQuery({ queryKey: spotKeys.all, queryFn: getPublishedSpots });
  const curation = useQuery({
    queryKey: homeCurationKeys.active,
    queryFn: getActiveHomeCurationSlots,
    staleTime: HOME_STATIC_STALE_MS,
  });
  const topSpots = useQuery({
    queryKey: spotKeys.top(TOP_COUNT),
    queryFn: () => getTopSpots(TOP_COUNT),
    staleTime: HOME_STATIC_STALE_MS,
  });
  const stays = useQuery({ queryKey: stayKeys.all, queryFn: getPublishedStays });

  const allSettled = [spots, curation, topSpots, stays].every((q) => q.status !== 'pending');

  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(id);
  }, [timeoutMs]);

  return { ready: allSettled || timedOut };
}
