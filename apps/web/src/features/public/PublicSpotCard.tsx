import Link from 'next/link';

import type { PublicSpot } from '@/lib/data/publicSpots';

type PublicSpotCardProps = {
  spot: PublicSpot;
};

export function PublicSpotCard({ spot }: PublicSpotCardProps) {
  return (
    <article className="overflow-hidden rounded-[32px] border border-[#F3D8E2] bg-white shadow-sm">
      <div className="h-32 bg-[radial-gradient(circle_at_top_left,_rgba(255,219,229,0.95),_rgba(255,244,246,0.7)_48%,_rgba(255,255,255,0.95)_100%)] px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C45C7E]">{spot.flower}</p>
            <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]">{spot.place}</h2>
            <p className="text-sm text-[#6B7280]">{spot.location}</p>
          </div>
          {spot.isFeatured ? (
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#C45C7E]">추천</span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap gap-2 text-xs font-medium text-[#8B5A6E]">
          <span className="rounded-full bg-[#FFF4F6] px-3 py-1">개화 {spot.bloomStartAt} - {spot.bloomEndAt}</span>
          <span className="rounded-full bg-[#FFF8EC] px-3 py-1 text-[#9A6B2F]">{spot.festivalDate}</span>
        </div>
        <p className="text-sm leading-6 text-gray-600">{spot.description}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-500">{spot.helper}</span>
          <Link
            href={`/spot/${spot.slug}`}
            className="rounded-2xl bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            자세히 보기
          </Link>
        </div>
      </div>
    </article>
  );
}
