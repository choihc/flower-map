import { describe, expect, it } from 'vitest';

import { flowerSchema } from './flowerSchema';

describe('flowerSchema', () => {
  it('accepts a valid flower payload', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      name_en: null,
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      sort_order: 1,
      is_active: true,
    });

    expect(result.success).toBe(true);
  });

  it('accepts a flower payload with thumbnail_url', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      thumbnail_url: 'https://blob.example.com/cherry.jpg',
    });

    expect(result.success).toBe(true);
    expect(result.data?.thumbnail_url).toBe('https://blob.example.com/cherry.jpg');
  });

  it('accepts a flower payload with thumbnail_url as null', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      thumbnail_url: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a month outside 1 through 12', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 0,
      season_end_month: 4,
      sort_order: 1,
      is_active: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a thumbnail_url that is not a valid URL', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      thumbnail_url: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a flower payload with aliases', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      aliases: ['벗꽃', '사쿠라'],
    });

    expect(result.success).toBe(true);
    expect(result.data?.aliases).toEqual(['벗꽃', '사쿠라']);
  });

  it('defaults aliases to an empty array when missing', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
    });

    expect(result.success).toBe(true);
    expect(result.data?.aliases).toEqual([]);
  });

  it('accepts an empty aliases array explicitly', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      aliases: [],
    });

    expect(result.success).toBe(true);
    expect(result.data?.aliases).toEqual([]);
  });

  // ── boost 날짜 검증 (FR-2-3) ──────────────────────────────────────────────

  it('accepts boost dates when both are null (no boost)', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      boost_start_at: null,
      boost_end_at: null,
    });

    expect(result.success).toBe(true);
  });

  it('accepts boost dates when both are omitted (no boost)', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
    });

    expect(result.success).toBe(true);
  });

  it('accepts boost dates when both are valid and start <= end', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      boost_start_at: '2026-06-01',
      boost_end_at: '2026-06-30',
    });

    expect(result.success).toBe(true);
  });

  it('accepts boost dates when start equals end', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      boost_start_at: '2026-06-15',
      boost_end_at: '2026-06-15',
    });

    expect(result.success).toBe(true);
  });

  it('rejects when only boost_start_at is provided (missing end)', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      boost_start_at: '2026-06-01',
      boost_end_at: null,
    });

    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages.some((m) => m.includes('시작일과 종료일을 모두 입력'))).toBe(true);
  });

  it('rejects when only boost_end_at is provided (missing start)', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      boost_start_at: null,
      boost_end_at: '2026-06-30',
    });

    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages.some((m) => m.includes('시작일과 종료일을 모두 입력'))).toBe(true);
  });

  it('rejects when boost_start_at is after boost_end_at', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      boost_start_at: '2026-06-30',
      boost_end_at: '2026-06-01',
    });

    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages.some((m) => m.includes('종료일은 시작일과 같거나 이후'))).toBe(true);
  });
});
