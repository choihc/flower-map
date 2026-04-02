// app/(tabs)/search.tsx
import { SearchScreen } from '../../src/features/search/screens/SearchScreen';

export default function SearchRoute() {
  // ScreenShell을 사용하지 않음 — SearchScreen이 SafeAreaView+FlatList로 직접 레이아웃 구성
  return <SearchScreen />;
}
