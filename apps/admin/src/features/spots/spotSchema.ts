import { z } from 'zod';

const dateSchema = z.iso.date();

export const spotSchema = z
  .object({
    flower_id: z.string().uuid(),
    slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
    name: z.string().trim().min(1),
    region_primary: z.string().trim().min(1),
    region_secondary: z.string().trim().min(1),
    address: z.string().trim().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    description: z.string().trim().min(1),
    short_tip: z.string().trim().min(1),
    parking_info: z.string().trim().min(1).nullable().optional(),
    admission_fee: z.string().trim().min(1).nullable().optional(),
    festival_name: z.string().trim().min(1).nullable().optional(),
    festival_start_at: dateSchema.nullable().optional(),
    festival_end_at: dateSchema.nullable().optional(),
    bloom_start_at: dateSchema,
    bloom_end_at: dateSchema,
    thumbnail_url: z.string().url().nullable().optional(),
    status: z.enum(['draft', 'published']).default('draft'),
    source_note: z.string().trim().min(1).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.bloom_start_at > value.bloom_end_at) {
      ctx.addIssue({
        code: 'custom',
        message: 'bloom_start_at must be on or before bloom_end_at',
        path: ['bloom_end_at'],
      });
    }

    if (value.festival_start_at != null && value.festival_end_at != null && value.festival_start_at > value.festival_end_at) {
      ctx.addIssue({
        code: 'custom',
        message: 'festival_start_at must be on or before festival_end_at',
        path: ['festival_end_at'],
      });
    }
  });

export type SpotSchema = z.infer<typeof spotSchema>;
