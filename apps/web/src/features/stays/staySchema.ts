import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const SEASON_WINDOW_REGEX = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

// zod v4의 z.string().url() 은 javascript:/data:/file: 스킴을 통과시키므로
// XSS 방지를 위해 http/https 스킴을 명시적으로 강제한다.
const httpsOnlyUrlSchema = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), {
    message: 'URL은 http(s) 스킴만 허용됩니다',
  });

const stayTypeSchema = z.enum(['city', 'resort', 'poolvilla', 'onsen', 'kids']);

const ratingScoreSchema = z.number().min(0).max(5);

const seasonWindowSchema = z.string().regex(SEASON_WINDOW_REGEX, {
  message: 'season_window는 MM-DD 형식이어야 합니다',
});

const dateSchema = z.iso.date();

export const staySchema = z
  .object({
    slug: z.string().trim().min(2).regex(SLUG_REGEX),
    name: z.string().trim().min(1),
    region_primary: z.string().trim().min(1),
    region_secondary: z.string().trim().min(1),
    address: z.string().trim().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    stay_type: stayTypeSchema,
    season_tags: z.array(z.string().trim().min(1)).optional().default([]),
    season_window_start: seasonWindowSchema.nullable().optional(),
    season_window_end: seasonWindowSchema.nullable().optional(),
    short_tagline: z.string().trim().min(1),
    description: z.string().trim().min(1),
    recommendation_points: z.array(z.string().trim().min(1)).max(10).optional().default([]),
    thumbnail_url: httpsOnlyUrlSchema.nullable().optional(),
    booking_query_override: z.string().trim().min(1).nullable().optional(),
    naver_rating_score: ratingScoreSchema.nullable().optional(),
    naver_rating_url: httpsOnlyUrlSchema.nullable().optional(),
    google_rating_score: ratingScoreSchema.nullable().optional(),
    google_rating_url: httpsOnlyUrlSchema.nullable().optional(),
    rating_captured_at: dateSchema.nullable().optional(),
    source_note: z.string().trim().min(1).nullable().optional(),
    status: z.enum(['draft', 'published']).default('draft'),
    is_featured: z.boolean().default(false),
    display_order: z.number().int().default(0),
  })
  .superRefine((value, ctx) => {
    const startEmpty = value.season_window_start == null;
    const endEmpty = value.season_window_end == null;
    if (startEmpty !== endEmpty) {
      ctx.addIssue({
        code: 'custom',
        message: 'season_window_start와 season_window_end는 함께 비어 있거나 함께 채워져야 합니다',
        path: ['season_window_end'],
      });
    }

    const naverScoreEmpty = value.naver_rating_score == null;
    const naverUrlEmpty = value.naver_rating_url == null;
    if (naverScoreEmpty !== naverUrlEmpty) {
      ctx.addIssue({
        code: 'custom',
        message: 'naver_rating_score와 naver_rating_url은 함께 비어 있거나 함께 채워져야 합니다',
        path: ['naver_rating_url'],
      });
    }

    const googleScoreEmpty = value.google_rating_score == null;
    const googleUrlEmpty = value.google_rating_url == null;
    if (googleScoreEmpty !== googleUrlEmpty) {
      ctx.addIssue({
        code: 'custom',
        message: 'google_rating_score와 google_rating_url은 함께 비어 있거나 함께 채워져야 합니다',
        path: ['google_rating_url'],
      });
    }

    const hasAnyRating = value.naver_rating_score != null || value.google_rating_score != null;
    if (hasAnyRating && value.rating_captured_at == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'rating 정보가 있으면 rating_captured_at이 필수입니다',
        path: ['rating_captured_at'],
      });
    }
  });

export type StaySchema = z.infer<typeof staySchema>;
