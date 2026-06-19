import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { CurationSection } from '../components/CurationSection';
import { TopSpotsSection } from '../components/TopSpotsSection';
import { HocanceTop5Section } from '../components/HocanceTop5Section';
import { EndingSoonSection } from '../components/EndingSoonSection';
import { RegionRecommendSection } from '../components/RegionRecommendSection';

export function HomeScreen() {
  // 통합 대기 게이트 없이 셸을 즉시 렌더하고, 각 섹션이 자기 데이터에 따라
  // 독립적으로 로딩/빈/에러를 처리한다. (FR-1·2·3)
  return (
    <ScreenShell>
      <CurationSection />
      <TopSpotsSection />
      <HocanceTop5Section />
      <EndingSoonSection />
      <NativeSpotAd />
      <RegionRecommendSection />
    </ScreenShell>
  );
}
