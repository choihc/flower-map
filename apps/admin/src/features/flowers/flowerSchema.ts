import { z } from 'zod';

const monthSchema = z.number().int().min(1).max(12);

export const flowerSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  name_ko: z.string().trim().min(1),
  name_en: z.string().trim().min(1).optional(),
  color_hex: z.string().trim().regex(/^#([A-Fa-f0-9]{6})$/),
  season_start_month: monthSchema,
  season_end_month: monthSchema,
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type FlowerSchema = z.infer<typeof flowerSchema>;
