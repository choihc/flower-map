import { describe, expect, it, vi } from 'vitest';

import type { HomeCurationRow } from './types';

const curationRows: HomeCurationRow[] = [
  {
    id: 'cur-1',
    slot_key: 'stays_entry',
    title: '호캉스 어디?',
    subtitle: '지금 가기 좋은 호캉스',
    cta_route: '/stays',
    cta_label: '바로가기',
    cover_image_url: 'https://blob.example.com/cur-1.jpg',
    is_active: true,
    display_order: 0,
  },
  {
    id: 'cur-2',
    slot_key: 'flowers_entry',
    title: '꽃 어디?',
    subtitle: null,
    cta_route: '/flowers',
    cta_label: '바로가기',
    cover_image_url: null,
    is_active: true,
    display_order: 1,
  },
];

type AnyFn = (...args: unknown[]) => unknown;

type ChainCalls = {
  eq: Array<[string, unknown]>;
  order: Array<[string, unknown?]>;
};

const lastCurationCalls: ChainCalls[] = [];

let rowsOverride: unknown[] | null = null;
let errorOverride: unknown = null;

function makeCurationChain() {
  const recorded: ChainCalls = { eq: [], order: [] };
  lastCurationCalls.push(recorded);

  const chain: Record<string, AnyFn> & PromiseLike<unknown> = {
    select(..._args: unknown[]) {
      return chain;
    },
    eq(column: unknown, value: unknown) {
      recorded.eq.push([String(column), value]);
      return chain;
    },
    order(column: unknown, options?: unknown) {
      recorded.order.push([String(column), options]);
      return chain;
    },
    then(onFulfilled?: (v: { data: unknown; error: unknown }) => unknown) {
      const data = rowsOverride ?? curationRows;
      return Promise.resolve({ data: errorOverride ? null : data, error: errorOverride }).then(
        onFulfilled,
      );
    },
  } as Record<string, AnyFn> & PromiseLike<unknown>;

  return chain;
}

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'home_curation') return makeCurationChain();
        throw new Error(`unexpected table: ${table}`);
      },
    },
  };
});

import { getActiveHomeCurationSlots, homeCurationKeys } from './homeCurationRepository';

describe('homeCurationRepository', () => {
  it('returns active curation slots mapped to domain, ordered by display_order asc', async () => {
    lastCurationCalls.length = 0;
    rowsOverride = null;
    errorOverride = null;

    const slots = await getActiveHomeCurationSlots();

    expect(slots).toHaveLength(2);
    expect(slots[0]?.slotKey).toBe('stays_entry');
    expect(slots[0]?.title).toBe('호캉스 어디?');
    expect(slots[1]?.slotKey).toBe('flowers_entry');
    expect(slots[1]?.subtitle).toBeNull();
    expect(slots[1]?.coverImageUrl).toBeNull();

    const recorded = lastCurationCalls.at(-1)!;
    expect(recorded.eq.some(([col, val]) => col === 'is_active' && val === true)).toBe(true);
    expect(recorded.order.some(([col, opt]) => col === 'display_order' && (opt as any)?.ascending === true)).toBe(true);
  });

  it('returns empty array when no rows', async () => {
    lastCurationCalls.length = 0;
    rowsOverride = [];
    errorOverride = null;

    const slots = await getActiveHomeCurationSlots();

    expect(slots).toEqual([]);

    rowsOverride = null;
  });

  it('throws when supabase returns an error', async () => {
    lastCurationCalls.length = 0;
    rowsOverride = null;
    errorOverride = new Error('db down');

    await expect(getActiveHomeCurationSlots()).rejects.toThrow('db down');

    errorOverride = null;
  });

  it('homeCurationKeys returns stable camelCase keys', () => {
    expect(homeCurationKeys.all).toEqual(['homeCuration']);
    expect(homeCurationKeys.active).toEqual(['homeCuration', 'active']);
  });
});
