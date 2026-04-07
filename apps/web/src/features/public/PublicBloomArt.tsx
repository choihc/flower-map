import type { CSSProperties } from 'react';

import type { PublicSpotTone } from './publicSpotsViewModel';

type PublicBloomArtProps = {
  size?: 'sm' | 'md' | 'lg';
  tone?: PublicSpotTone;
};

const PALETTE = {
  pink: { bloom: '#FBEAF0', core: '#F26D85' },
  yellow: { bloom: '#FBF0C0', core: '#F4C542' },
  green: { bloom: '#E4EFDF', core: '#FAE5D8' },
};

const SIZE_STYLE: Record<NonNullable<PublicBloomArtProps['size']>, CSSProperties> = {
  sm: { width: 72, height: 72 },
  md: { width: 112, height: 112 },
  lg: { width: 168, height: 168 },
};

export function PublicBloomArt({ size = 'md', tone = 'pink' }: PublicBloomArtProps) {
  const palette = PALETTE[tone];

  return (
    <div className="relative flex items-center justify-center" style={SIZE_STYLE[size]}>
      <div className="absolute left-[33%] top-[12%] h-[34%] w-[34%] rounded-full" style={{ backgroundColor: palette.bloom }} />
      <div className="absolute left-[12%] top-[33%] h-[34%] w-[34%] rounded-full" style={{ backgroundColor: palette.bloom }} />
      <div className="absolute right-[12%] top-[33%] h-[34%] w-[34%] rounded-full" style={{ backgroundColor: palette.bloom }} />
      <div className="absolute bottom-[12%] left-[33%] h-[34%] w-[34%] rounded-full" style={{ backgroundColor: palette.bloom }} />
      <div className="absolute left-[37%] top-[37%] h-[26%] w-[26%] rounded-full" style={{ backgroundColor: palette.core }} />
    </div>
  );
}
