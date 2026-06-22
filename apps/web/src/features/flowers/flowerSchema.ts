import { z } from 'zod';

const monthSchema = z.number().int().min(1).max(12);

const boostDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional();

export const flowerSchema = z
  .object({
    slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
    name_ko: z.string().trim().min(1),
    name_en: z.string().trim().min(1).nullable().optional(),
    color_hex: z.string().trim().regex(/^#([A-Fa-f0-9]{6})$/),
    season_start_month: monthSchema,
    season_end_month: monthSchema,
    sort_order: z.number().int().default(0),
    is_active: z.boolean().default(true),
    thumbnail_url: z.string().url().nullable().optional(),
    aliases: z.array(z.string()).optional().default([]),
    boost_start_at: boostDate,
    boost_end_at: boostDate,
  })
  .superRefine((v, ctx) => {
    const s = v.boost_start_at ?? null;
    const e = v.boost_end_at ?? null;
    if ((s === null) !== (e === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['boost_start_at'],
        message: '집중 노출 기간은 시작일과 종료일을 모두 입력해야 합니다.',
      });
    }
    if (s !== null && e !== null && s > e) {
      ctx.addIssue({
        code: 'custom',
        path: ['boost_end_at'],
        message: '집중 노출 종료일은 시작일과 같거나 이후여야 합니다.',
      });
    }
  });

export type FlowerSchema = z.infer<typeof flowerSchema>;
