import type { StayType } from '../../../shared/data/types';

export type StayTypeLabel = {
  ko: string;
};

const STAY_TYPE_LABELS: Record<StayType, StayTypeLabel> = {
  city: { ko: '도심' },
  resort: { ko: '리조트' },
  poolvilla: { ko: '풀빌라' },
  onsen: { ko: '온천' },
  kids: { ko: '키즈' },
  ocean: { ko: '오션뷰' },
  island: { ko: '아일랜드' },
};

const FALLBACK_LABEL: StayTypeLabel = { ko: '호텔' };

export function getStayTypeLabel(type: StayType): StayTypeLabel {
  return STAY_TYPE_LABELS[type] ?? FALLBACK_LABEL;
}

export function formatStayTypeBadge(type: StayType): string {
  return getStayTypeLabel(type).ko;
}
