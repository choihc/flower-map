import { getAllSpots, type FlowerSpot } from "@flower-map/flower-domain";
import { createRoute } from "@granite-js/react-native";
import { useQuery } from "@tanstack/react-query";
import { Loader, PageNavbar, SearchField } from "@toss/tds-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { SpotListItem } from "../src/features/search/components/SpotListItem";
import { SafeInlineAd } from "../src/shared/components/SafeInlineAd";

export const Route = createRoute("/search", {
  component: SearchPage,
});

function SearchPage() {
  const navigation = Route.useNavigation();
  const [query, setQuery] = useState("");

  const { data: spots = [], isPending } = useQuery({
    queryKey: ["all-spots"],
    queryFn: getAllSpots,
  });

  const results = useMemo(() => {
    if (!query.trim()) return spots;
    const q = query.trim().toLowerCase();
    return spots.filter(
      (s) =>
        s.place.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false),
    );
  }, [spots, query]);

  const handlePress = (spot: FlowerSpot) => {
    navigation.navigate("/spot/:id", { id: spot.id });
  };

  return (
    <View style={styles.page}>
      <PageNavbar>
        <PageNavbar.Title>검색</PageNavbar.Title>
      </PageNavbar>
      <View style={styles.searchBox}>
        <SearchField
          placeholder="명소 이름, 지역으로 검색"
          value={query}
          onChange={(e) => setQuery(e.nativeEvent.text)}
          hasClearButton
        />
      </View>
      {isPending ? (
        <View style={styles.center}>
          <Loader size="medium" type="primary" />
        </View>
      ) : (
        <ScrollView>
          {results.length === 0 ? (
            <Text style={styles.empty}>검색 결과가 없습니다.</Text>
          ) : (
            <>
              {results.map((spot, index) => (
                <React.Fragment key={spot.id}>
                  <SpotListItem spot={spot} onPress={handlePress} />
                  {((index + 1) % 5 === 0 ||
                    (results.length < 5 && index === results.length - 1)) && (
                    <SafeInlineAd
                      adGroupId="ait-ad-test-banner-id"
                      impressFallbackOnMount={true}
                      style={styles.listBanner}
                    />
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  searchBox: { paddingHorizontal: 16, paddingVertical: 8 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  empty: { textAlign: "center", color: "#888", marginTop: 40, fontSize: 15 },
  listBanner: {
    height: 96,
    backgroundColor: "#F9F0F4",
    marginVertical: 8,
  },
});
