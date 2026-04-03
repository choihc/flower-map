import { Button } from '@toss/tds-react-native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

type FilterItem = { label: string; value: string };

type FlowerFilterChipsProps = {
  filters: FilterItem[] | string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
};

export function FlowerFilterChips({
  filters,
  selected,
  onSelect,
}: FlowerFilterChipsProps) {
  // Normalize filters to { label, value } format
  const normalized: FilterItem[] = filters.map((f) =>
    typeof f === 'string' ? { label: f, value: f } : f,
  );

  const all = [{ label: '전체', value: null as unknown as string }, ...normalized];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {all.map((f) => {
        const isActive = f.value === selected;
        return (
          <View key={f.value ?? '__all'} style={styles.chip}>
            <Button
              size="tiny"
              type={isActive ? 'primary' : 'light'}
              style={isActive ? 'fill' : 'weak'}
              onPress={() => onSelect(isActive ? null : f.value)}
            >
              {f.label}
            </Button>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {},
});
