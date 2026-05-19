import { z } from 'zod';

import { flowerSchema } from '../flowers/flowerSchema';
import { spotSchema } from '../spots/spotSchema';
import { staySchema } from '../stays/staySchema';

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

const staysBulkSchema = z
  .object({
    stays: z.array(staySchema).min(1),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.stays.forEach((stay, index) => {
      if (seen.has(stay.slug)) {
        ctx.addIssue({
          code: 'custom',
          message: `${stay.slug} slug가 동일 payload 내에서 중복됩니다`,
          path: ['stays', index, 'slug'],
        });
      } else {
        seen.add(stay.slug);
      }
    });
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
  z.object({
    stay: staySchema,
  }),
  staysBulkSchema,
]);

export type ImportPayload = z.infer<typeof importPayloadSchema>;

/** stay 분기를 제외한 spot/flower 도메인 payload. */
export type SpotImportPayload = Exclude<ImportPayload, { stay: unknown } | { stays: unknown }>;

/** stay 단건 등록 payload. */
export type StaySingleImportPayload = Extract<ImportPayload, { stay: unknown }>;

/** stay 복수 등록 payload. */
export type StayBulkImportPayload = Extract<ImportPayload, { stays: unknown }>;

/** stay 도메인 import payload (단건 또는 복수). */
export type StayImportPayload = StaySingleImportPayload | StayBulkImportPayload;
