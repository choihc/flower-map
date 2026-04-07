import Image from 'next/image';

import { PublicBloomArt } from './PublicBloomArt';
import type { PublicSpotViewModel } from './publicSpotsViewModel';

type PublicSpotImageProps = {
  spot: PublicSpotViewModel;
  heightClassName: string;
  bloomSize?: 'sm' | 'md' | 'lg';
};

const TONE_BG: Record<PublicSpotViewModel['tone'], string> = {
  pink: '#FBE8F0',
  yellow: '#FBF0C0',
  green: '#E8F5E9',
};

export function PublicSpotImage({ spot, heightClassName, bloomSize = 'md' }: PublicSpotImageProps) {
  const uri = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;

  if (!uri) {
    return (
      <div
        className={`relative flex w-full items-center justify-center overflow-hidden ${heightClassName}`}
        style={{ backgroundColor: TONE_BG[spot.tone] }}
      >
        <PublicBloomArt size={bloomSize} tone={spot.tone} />
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden ${heightClassName}`}>
      <Image alt={spot.place} className="object-cover" fill sizes="(max-width: 768px) 100vw, 50vw" src={uri} />
    </div>
  );
}
