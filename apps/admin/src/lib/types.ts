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
    };
  };
};
