import type { SupabaseClient } from '@supabase/supabase-js';

import { PublicFeedSpotCard } from '@/features/public/PublicFeedSpotCard';
import { PublicFlowerFilterChips } from '@/features/public/PublicFlowerFilterChips';
import { PublicHeroCarousel } from '@/features/public/PublicHeroCarousel';
import { toPublicSpotViewModels } from '@/features/public/publicSpotsViewModel';
import { listPublicSpots } from '@/lib/data/publicSpots';
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

type HomePageProps = {
  searchParams?: Promise<{ flower?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = createPublicServerSupabaseClient();
  const spots = toPublicSpotViewModels(await listPublicSpots(supabase));
  const resolvedSearchParams = searchParams == null ? {} : await searchParams;
  const selectedFlower = resolvedSearchParams.flower ?? null;

  const filters = [...new Set(spots.map((spot) => spot.flower))].map((flower) => ({
    label: flower,
    value: flower,
  }));

  const filteredSpots = selectedFlower ? spots.filter((spot) => spot.flower === selectedFlower) : spots;
  const heroSpots = spots.slice(0, 5);

  return (
    <main className="space-y-4 pb-10">
      <section className="space-y-5 px-4 pt-6 md:mx-auto md:max-w-5xl md:px-0">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C45C7E]">꽃 어디</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#3D1A27] md:text-4xl">지금 보기 좋은 명소</h1>
        </div>

        <PublicHeroCarousel spots={heroSpots} />
      </section>

      <section className="md:mx-auto md:max-w-5xl">
        <PublicFlowerFilterChips filters={filters} selected={selectedFlower} basePath="/" />
      </section>

      <section className="space-y-3 px-4 md:mx-auto md:max-w-5xl md:px-0">
        <h2 className="text-lg font-bold text-[#3D1A27]">
          {selectedFlower ? `${selectedFlower} 명소` : '지금 보기 좋은 명소'}
        </h2>
        {filteredSpots.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#B09099]">해당 꽃 명소가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {filteredSpots.map((spot) => (
              <PublicFeedSpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
