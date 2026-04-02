// src/features/search/screens/SearchScreen.tsx
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { colors } from '../../../shared/theme/colors';
import { SearchResultCard } from '../../../shared/ui/SearchResultCard';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import type { FlowerSpot } from '../../../shared/data/types';

type SearchHeaderProps = {
  query: string;
  onChangeText: (text: string) => void;
  isLoading: boolean;
  isError: boolean;
  resultsCount: number;
};

// ListHeaderComponent에 인라인 함수를 전달하면 렌더마다 재마운트되어 TextInput 포커스가 해제됨.
// 컴포넌트를 SearchScreen 밖에 정의하고 JSX 엘리먼트로 전달해 이를 방지함.
function SearchHeader({ query, onChangeText, isLoading, isError, resultsCount }: SearchHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>검색</Text>
      <TextInput
        style={styles.input}
        placeholder="꽃 이름, 명소, 지역으로 검색"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={onChangeText}
        keyboardType="default"
        returnKeyType="search"
        autoCorrect={false}
      />
      {isLoading && (
        <View style={styles.skeletonGroup}>
          <SkeletonBox testID="skeleton-box" height={88} borderRadius={16} />
          <SkeletonBox testID="skeleton-box" height={88} borderRadius={16} />
          <SkeletonBox testID="skeleton-box" height={88} borderRadius={16} />
        </View>
      )}
      {isError && (
        <Text style={styles.errorText}>
          데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </Text>
      )}
      {!isLoading && !isError && query.trim() === '' && (
        <Text style={styles.guideText}>꽃 이름, 명소 이름, 지역으로 검색해보세요</Text>
      )}
      {!isLoading && !isError && query.trim() !== '' && resultsCount > 0 && (
        <Text style={styles.countText}>{resultsCount}곳의 명소를 찾았어요</Text>
      )}
      {!isLoading && !isError && query.trim() !== '' && resultsCount === 0 && (
        <Text style={styles.emptyText}>검색 결과가 없어요</Text>
      )}
    </View>
  );
}

export function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: spots = [], isLoading, isError } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });

  // FlowerSpot 필드명 참고: src/shared/data/types.ts
  // place(명소명), flower(꽃이름), location(지역), helper(한줄설명) — 모두 string
  const results = useMemo<FlowerSpot[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return spots.filter(
      (s) =>
        s.place.toLowerCase().includes(q) ||
        s.flower.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.helper.toLowerCase().includes(q),
    );
  }, [query, spots]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SearchResultCard
            spot={item}
            onPress={() => router.push(`/spot/${item.slug}`)}
          />
        )}
        ListHeaderComponent={
          <SearchHeader
            query={query}
            onChangeText={setQuery}
            isLoading={isLoading}
            isError={isError}
            resultsCount={results.length}
          />
        }
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  countText: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 40,
    textAlign: 'center',
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  guideText: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 40,
    textAlign: 'center',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  skeletonGroup: {
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 14,
    marginTop: 8,
  },
});
