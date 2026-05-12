import { describe, expect, it } from 'vitest';

import { toHomeCurationSlot } from './homeCurationMappers';
import type { HomeCurationRow } from './types';

const baseCurationRow: HomeCurationRow = {
  id: 'cur-1',
  slot_key: 'stays_entry',
  title: '호캉스 어디?',
  subtitle: '지금 가기 좋은 호캉스',
  cta_route: '/stays',
  cta_label: '바로가기',
  cover_image_url: 'https://blob.example.com/cur-1.jpg',
  is_active: true,
  display_order: 0,
};

describe('toHomeCurationSlot', () => {
  it('maps HomeCurationRow to HomeCurationSlot domain', () => {
    const slot = toHomeCurationSlot(baseCurationRow);

    expect(slot.id).toBe('cur-1');
    expect(slot.slotKey).toBe('stays_entry');
    expect(slot.title).toBe('호캉스 어디?');
    expect(slot.subtitle).toBe('지금 가기 좋은 호캉스');
    expect(slot.ctaRoute).toBe('/stays');
    expect(slot.ctaLabel).toBe('바로가기');
    expect(slot.coverImageUrl).toBe('https://blob.example.com/cur-1.jpg');
    expect(slot.isActive).toBe(true);
    expect(slot.displayOrder).toBe(0);
  });

  it('keeps subtitle and cover_image_url null when null', () => {
    const slot = toHomeCurationSlot({
      ...baseCurationRow,
      subtitle: null,
      cover_image_url: null,
    });

    expect(slot.subtitle).toBeNull();
    expect(slot.coverImageUrl).toBeNull();
  });
});
