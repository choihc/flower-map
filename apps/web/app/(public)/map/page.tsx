import type { SupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';

import { listPublicSpots } from '@/lib/data/publicSpots';
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

export default async function MapPage() {
  const supabase = createPublicServerSupabaseClient();
  const spots = await listPublicSpots(supabase);

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C45C7E]">Map</p>
        <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">지도로 둘러보기</h1>
        <p className="max-w-2xl text-base leading-7 text-gray-500">
          네이버 지도 웹 SDK 전환 전까지는 좌표 기반 미리보기로 공개 데이터를 확인할 수 있습니다.
        </p>
      </div>

      <section className="mt-10 rounded-[32px] border border-[#F3D8E2] bg-[#FFF4F6] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {spots.map((spot) => (
            <article key={spot.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C45C7E]">{spot.flower}</p>
              <h2 className="mt-2 text-xl font-bold text-[#1A1A1A]">{spot.place}</h2>
              <p className="mt-1 text-sm text-gray-500">{spot.location}</p>
              <p className="mt-4 text-sm text-[#8B5A6E]">
                좌표: {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
              </p>
              <div className="mt-4">
                <Link href={`/spot/${spot.slug}`} className="text-sm font-semibold text-[#1A1A1A] underline underline-offset-4">
                  상세 보기
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
