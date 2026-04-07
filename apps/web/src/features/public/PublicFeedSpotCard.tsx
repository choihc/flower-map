import Link from 'next/link';

import { PublicSpotImage } from './PublicSpotImage';
import type { PublicSpotViewModel } from './publicSpotsViewModel';

type PublicFeedSpotCardProps = {
  spot: PublicSpotViewModel;
};

const TONE_BADGE: Record<PublicSpotViewModel['tone'], string> = {
  green: 'bg-[#E8F5E9] text-[#3E7A49]',
  pink: 'bg-[#EEF3FF] text-[#4B69B1]',
  yellow: 'bg-[#E7F7F5] text-[#2F7E73]',
};

export function PublicFeedSpotCard({ spot }: PublicFeedSpotCardProps) {
  return (
    <Link href={`/spot/${spot.slug}`} className="block overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <PublicSpotImage spot={spot} heightClassName="h-[180px]" bloomSize="md" />
      <div className="space-y-2 p-4">
        <div className="flex">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_BADGE[spot.tone]}`}>{spot.flower}</span>
        </div>
        <p className="text-lg font-bold text-[#3D1A27]">{spot.place}</p>
        <p className="text-sm font-semibold text-[#C45C7E]">{spot.badge}</p>
        {spot.description ? <p className="text-sm leading-5 text-[#8B5A6E] line-clamp-2">{spot.description}</p> : null}
      </div>
    </Link>
  );
}
