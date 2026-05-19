export type FlowerRow = {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  color_hex: string;
  season_start_month: number;
  season_end_month: number;
  sort_order: number;
  is_active: boolean;
  thumbnail_url: string | null;
  aliases: string[];
  created_at: string;
  updated_at: string;
};

export type AdminUserRow = {
  user_id: string;
  granted_at: string;
  note: string | null;
};

export type SpotStatus = 'draft' | 'published';
export type SpotSourceType = 'manual_json';

export type SpotRow = {
  id: string;
  flower_id: string;
  slug: string;
  name: string;
  region_primary: string;
  region_secondary: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  short_tip: string;
  parking_info: string | null;
  admission_fee: string | null;
  festival_name: string | null;
  festival_start_at: string | null;
  festival_end_at: string | null;
  bloom_start_at: string;
  bloom_end_at: string;
  thumbnail_url: string | null;
  status: SpotStatus;
  source_type: SpotSourceType;
  source_note: string | null;
  is_featured: boolean;
  display_order: number;
  bloom_score: number | null;
  trend_score: number | null;
  content_score: number | null;
  yoy_score: number | null;
  now_score: number | null;
  now_score_at: string | null;
  exclude_keywords: string[];
  created_at: string;
  updated_at: string;
};

export type FlowerInsert = {
  slug: string;
  name_ko: string;
  name_en?: string | null;
  color_hex: string;
  season_start_month: number;
  season_end_month: number;
  sort_order?: number;
  is_active?: boolean;
  thumbnail_url?: string | null;
  aliases?: string[];
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type FlowerUpdate = Partial<Omit<FlowerInsert, 'id' | 'created_at' | 'updated_at'>>;

export type SpotInsert = {
  flower_id: string;
  slug: string;
  name: string;
  region_primary: string;
  region_secondary: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  short_tip: string;
  parking_info?: string | null;
  admission_fee?: string | null;
  festival_name?: string | null;
  festival_start_at?: string | null;
  festival_end_at?: string | null;
  bloom_start_at: string;
  bloom_end_at: string;
  thumbnail_url?: string | null;
  status?: SpotStatus;
  source_type?: SpotSourceType;
  source_note?: string | null;
  is_featured?: boolean;
  display_order?: number;
  bloom_score?: number | null;
  trend_score?: number | null;
  content_score?: number | null;
  yoy_score?: number | null;
  now_score?: number | null;
  now_score_at?: string | null;
  exclude_keywords?: string[];
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SpotUpdate = Partial<Omit<SpotInsert, 'id' | 'created_at' | 'updated_at'>>;

export type SpotPhotoRow = {
  id: string;
  spot_id: string;
  url: string;
  sort_order: number;
  caption: string | null;
  created_at: string;
};

export type SpotPhotoInsert = {
  spot_id: string;
  url: string;
  sort_order?: number;
  caption?: string | null;
  id?: string;
  created_at?: string;
};

export type SpotVideoRow = {
  id: string;
  spot_id: string;
  video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  view_count: number | null;
  relevance_score: number | null;
  fetched_at: string;
};

export type SpotVideoInsert = {
  spot_id: string;
  video_id: string;
  title: string;
  channel_title?: string | null;
  thumbnail_url?: string | null;
  published_at?: string | null;
  view_count?: number | null;
  relevance_score?: number | null;
  id?: string;
  fetched_at?: string;
};

export type SpotBlogRow = {
  id: string;
  spot_id: string;
  url: string;
  title: string;
  description: string | null;
  blogger_name: string | null;
  posted_at: string | null;
  relevance_score: number | null;
  fetched_at: string;
};

export type SpotBlogInsert = {
  spot_id: string;
  url: string;
  title: string;
  description?: string | null;
  blogger_name?: string | null;
  posted_at?: string | null;
  relevance_score?: number | null;
  id?: string;
  fetched_at?: string;
};

export type StayType = 'city' | 'resort' | 'poolvilla' | 'onsen' | 'kids' | 'ocean' | 'island';
export type StayStatus = 'draft' | 'published';
export type StaySourceType = 'manual_json';

export type StayVideoInsert = {
  stay_id: string;
  video_id: string;
  title: string;
  channel_title?: string | null;
  thumbnail_url?: string | null;
  published_at?: string | null;
  view_count?: number | null;
  relevance_score?: number | null;
  id?: string;
  fetched_at?: string;
};

export type StayBlogInsert = {
  stay_id: string;
  url: string;
  title: string;
  description?: string | null;
  blogger_name?: string | null;
  posted_at?: string | null;
  relevance_score?: number | null;
  id?: string;
  fetched_at?: string;
};

export type StayRow = {
  id: string;
  slug: string;
  name: string;
  region_primary: string;
  region_secondary: string;
  address: string;
  latitude: number;
  longitude: number;
  stay_type: StayType;
  season_tags: string[];
  season_window_start: string | null;
  season_window_end: string | null;
  short_tagline: string;
  description: string;
  recommendation_points: string[];
  thumbnail_url: string | null;
  booking_query_override: string | null;
  naver_rating_score: number | null;
  naver_rating_url: string | null;
  google_rating_score: number | null;
  google_rating_url: string | null;
  rating_captured_at: string | null;
  source_type: StaySourceType;
  source_note: string | null;
  status: StayStatus;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type StayInsert = {
  slug: string;
  name: string;
  region_primary: string;
  region_secondary: string;
  address: string;
  latitude: number;
  longitude: number;
  stay_type: StayType;
  season_tags?: string[];
  season_window_start?: string | null;
  season_window_end?: string | null;
  short_tagline: string;
  description: string;
  recommendation_points?: string[];
  thumbnail_url?: string | null;
  booking_query_override?: string | null;
  naver_rating_score?: number | null;
  naver_rating_url?: string | null;
  google_rating_score?: number | null;
  google_rating_url?: string | null;
  rating_captured_at?: string | null;
  source_type?: StaySourceType;
  source_note?: string | null;
  status?: StayStatus;
  is_featured?: boolean;
  display_order?: number;
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type StayUpdate = Partial<Omit<StayInsert, 'id' | 'created_at' | 'updated_at'>>;

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: AdminUserRow;
        Insert: {
          user_id: string;
          granted_at?: string;
          note?: string | null;
        };
        Update: {
          granted_at?: string;
          note?: string | null;
        };
      };
      flowers: {
        Row: FlowerRow;
        Insert: FlowerInsert;
        Update: FlowerUpdate;
      };
      spots: {
        Row: SpotRow;
        Insert: SpotInsert;
        Update: SpotUpdate;
      };
      spot_photos: {
        Row: SpotPhotoRow;
        Insert: SpotPhotoInsert;
        Update: Partial<Omit<SpotPhotoInsert, 'id' | 'created_at'>>;
      };
      spot_videos: {
        Row: SpotVideoRow;
        Insert: SpotVideoInsert;
        Update: Partial<Omit<SpotVideoInsert, 'id' | 'fetched_at'>>;
      };
      spot_blogs: {
        Row: SpotBlogRow;
        Insert: SpotBlogInsert;
        Update: Partial<Omit<SpotBlogInsert, 'id' | 'fetched_at'>>;
      };
      stays: {
        Row: StayRow;
        Insert: StayInsert;
        Update: StayUpdate;
      };
    };
  };
};
