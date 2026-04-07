import Link from 'next/link';

import { PublicSpotImage } from './PublicSpotImage';
import type { PublicSpotViewModel } from './publicSpotsViewModel';

type PublicHeroCarouselProps = {
  spots: PublicSpotViewModel[];
};

export function PublicHeroCarousel({ spots }: PublicHeroCarouselProps) {
  if (spots.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div
        className="scrollbar-hidden overflow-x-auto"
        data-testid="hero-carousel-track"
      >
        <div className="flex snap-x snap-mandatory">
          {spots.map((spot) => (
            <Link
              key={spot.id}
              href={`/spot/${spot.slug}`}
              className="group relative mr-4 block w-[calc(100%-16px)] shrink-0 snap-start overflow-hidden rounded-[24px] bg-[#FBE8F0] last:mr-0"
            >
              <PublicSpotImage spot={spot} heightClassName="h-[220px] md:h-[260px]" bloomSize="lg" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.38))]" />
              <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-white">
                <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {spot.badge}
                </span>
                <div>
                  <p className="text-2xl font-extrabold">{spot.place}</p>
                  <p className="mt-1 text-sm text-white/85">{spot.flower} · {spot.location}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2">
        {spots.map((spot, index) => (
          <div
            key={spot.id}
            className={index === 0 ? 'h-1.5 w-5 rounded-full bg-[#C45C7E]' : 'h-1.5 w-1.5 rounded-full bg-[#F0C0D4]'}
          />
        ))}
      </div>
    </section>
  );
}
