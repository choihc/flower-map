import type { SupabaseClient } from '@supabase/supabase-js';

import { PublicSearchSpotListItem } from '@/features/public/PublicSearchSpotListItem';
import { toPublicSpotViewModels } from '@/features/public/publicSpotsViewModel';
import { listPublicSpots } from '@/lib/data/publicSpots';
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

type SearchPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps = {}) {
  const supabase = createPublicServerSupabaseClient();
  const spots = toPublicSpotViewModels(await listPublicSpots(supabase));
  const resolvedSearchParams = searchParams == null ? {} : await searchParams;
  const query = resolvedSearchParams.q?.trim() ?? '';
  const normalizedQuery = query.toLowerCase();

  const results = normalizedQuery
    ? spots.filter(
        (spot) =>
          spot.place.toLowerCase().includes(normalizedQuery) ||
          spot.location.toLowerCase().includes(normalizedQuery) ||
          spot.description.toLowerCase().includes(normalizedQuery),
      )
    : spots;

  return (
    <main className="min-h-[calc(100vh-160px)] bg-white">
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4 px-4 py-6 md:px-0">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C45C7E]">꽃 어디</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#142218]">검색</h1>
          </div>

          <form action="/search">
            <input
              aria-label="명소 검색"
              className="w-full rounded-2xl border border-[#E7E2DB] bg-[#FAFAFA] px-4 py-3 text-sm outline-none placeholder:text-[#999] focus:border-[#C45C7E] focus:bg-white"
              defaultValue={query}
              name="q"
              placeholder="명소 이름, 지역으로 검색"
              type="search"
            />
          </form>
        </div>

        <section>
          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[#888]">검색 결과가 없습니다.</p>
          ) : (
            results.map((spot) => <PublicSearchSpotListItem key={spot.id} spot={spot} />)
          )}
        </section>
      </div>
    </main>
  );
}
