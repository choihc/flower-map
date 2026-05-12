import type { HomeCurationRow, HomeCurationSlot } from './types';

export function toHomeCurationSlot(row: HomeCurationRow): HomeCurationSlot {
  return {
    id: row.id,
    slotKey: row.slot_key,
    title: row.title,
    subtitle: row.subtitle,
    ctaRoute: row.cta_route,
    ctaLabel: row.cta_label,
    coverImageUrl: row.cover_image_url,
    isActive: row.is_active,
    displayOrder: row.display_order,
  };
}
