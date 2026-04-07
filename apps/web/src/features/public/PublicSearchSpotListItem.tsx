import Link from 'next/link';

import type { PublicSpotViewModel } from './publicSpotsViewModel';

type PublicSearchSpotListItemProps = {
  spot: PublicSpotViewModel;
};

export function PublicSearchSpotListItem({ spot }: PublicSearchSpotListItemProps) {
  return (
    <Link
      href={`/spot/${spot.slug}`}
      className="flex items-center justify-between gap-4 border-b border-[#F0EDE8] bg-white px-4 py-4 transition-colors hover:bg-[#FFF9FB]"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-base font-semibold text-[#142218]">{spot.place}</p>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-[#5C9E66]">{spot.flower}</span>
          <span className="text-[#CCC]">·</span>
          <span className="text-[#888]">{spot.location}</span>
        </div>
        {spot.description ? <p className="truncate text-sm text-[#888]">{spot.description}</p> : null}
      </div>
      <span className="shrink-0 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-semibold text-[#3E7A49]">
        {spot.badge}
      </span>
    </Link>
  );
}
