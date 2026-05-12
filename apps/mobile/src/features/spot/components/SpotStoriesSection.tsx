import { useQuery } from '@tanstack/react-query';

import { getSpotContent, spotKeys } from '../../../shared/data/spotRepository';
import { StoriesSection } from '../../../shared/ui/StoriesSection';

type SpotStoriesSectionProps = {
  slug: string;
};

export function SpotStoriesSection({ slug }: SpotStoriesSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: spotKeys.content(slug),
    queryFn: () => getSpotContent(slug),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) return null;

  const videos = data?.videos ?? [];
  const blogs = data?.blogs ?? [];

  return (
    <StoriesSection
      videos={videos}
      blogs={blogs}
      sectionTitle="이 명소 이야기"
      testID="spot-stories-section"
    />
  );
}
