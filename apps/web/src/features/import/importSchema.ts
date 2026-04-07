import { z } from 'zod';

import { flowerSchema } from '../flowers/flowerSchema';
import { spotSchema } from '../spots/spotSchema';

const { flower_id: _flowerId, ...importedSpotShape } = spotSchema.shape;

const importedPhotoSchema = z.object({
  url: z.string().url(),
  sort_order: z.number().int().optional().default(0),
  caption: z.string().nullable().optional(),
});

const importedSpotSchema = z
  .object({
    ...importedSpotShape,
    thumbnail_url: z.preprocess((value) => (value === '' ? undefined : value), spotSchema.shape.thumbnail_url),
    photos: z.array(importedPhotoSchema).optional().default([]),
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

export const importPayloadSchema = z.union([
  z.object({
    flower: flowerSchema,
    spots: z.array(importedSpotSchema).min(1),
  }),
  z.object({
    flower_slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
    spot: importedSpotSchema,
  }),
]);

export type ImportPayload = z.infer<typeof importPayloadSchema>;
