import type { SupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicSpotImage } from '@/features/public/PublicSpotImage';
import { toPublicSpotViewModel } from '@/features/public/publicSpotsViewModel';
import { getPublicSpotBySlug } from '@/lib/data/publicSpots';
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

type SpotDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SpotDetailPage({ params }: SpotDetailPageProps) {
  const { slug } = await params;
  const supabase = createPublicServerSupabaseClient();
  const spot = await getPublicSpotBySlug(supabase, slug);

  if (spot == null) {
    notFound();
    return null;
  }

  const viewModel = toPublicSpotViewModel(spot);
  const directionsHref = `https://map.naver.com/p/search/${encodeURIComponent(viewModel.place)}`;

  return (
    <main className="mx-auto max-w-3xl bg-[#FFF5F8] px-4 py-6 md:px-6 md:py-10">
      <article className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_rgba(196,92,126,0.08)]">
        <PublicSpotImage spot={viewModel} heightClassName="h-[260px]" bloomSize="lg" />

        <div className="space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#FDE8F0] px-3 py-1 text-xs font-semibold text-[#C45C7E]">
              {viewModel.flower}
            </span>
            <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#5F6672]">
              {viewModel.badge}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#3D1A27]">{viewModel.place}</h1>
            <p className="text-sm text-[#8B5A6E]">{viewModel.location} · {viewModel.bloomStatus}</p>
            <p className="text-sm font-semibold text-[#C45C7E]">🌸 {viewModel.bloomStartAt} ~ {viewModel.bloomEndAt}</p>
          </div>

          {viewModel.description ? <p className="text-[15px] leading-7 text-[#333]">{viewModel.description}</p> : null}

          {viewModel.helper ? (
            <div className="rounded-2xl bg-[#FDE8F0] px-4 py-4">
              <p className="text-sm leading-6 text-[#8B3A55]">💡 {viewModel.helper}</p>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[#888]">입장료</p>
              <p className="text-sm font-medium text-[#333]">{viewModel.fee}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#888]">주차</p>
              <p className="text-sm font-medium text-[#333]">{viewModel.parking}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href={directionsHref}
              className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-[#C45C7E] text-sm font-bold text-white"
              target="_blank"
            >
              길찾기
            </Link>
            <button
              aria-label="저장하기"
              className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] border border-[#F0C0D4] bg-[#FDE8F0] text-sm font-bold text-[#C45C7E] disabled:cursor-not-allowed"
              disabled
              type="button"
            >
              저장하기
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}
