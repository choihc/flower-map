import type { StayType } from '../../../shared/data/types';

export type StayTypeLabel = {
  ko: string;
  emoji: string;
};

const STAY_TYPE_LABELS: Record<StayType, StayTypeLabel> = {
  city: { ko: '도심', emoji: '🏙' },
  resort: { ko: '리조트', emoji: '🌊' },
  poolvilla: { ko: '풀빌라', emoji: '🏝' },
  onsen: { ko: '온천', emoji: '♨️' },
  kids: { ko: '키즈', emoji: '🧸' },
  ocean: { ko: '오션뷰', emoji: '🌊' },
  island: { ko: '아일랜드', emoji: '🌴' },
};

const FALLBACK_LABEL: StayTypeLabel = { ko: '호텔', emoji: '🏨' };

export function getStayTypeLabel(type: StayType): StayTypeLabel {
  return STAY_TYPE_LABELS[type] ?? FALLBACK_LABEL;
}

export function formatStayTypeBadge(type: StayType): string {
  const { ko, emoji } = getStayTypeLabel(type);
  return `${emoji} ${ko}`;
}
