import { Icon } from '@toss/tds-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TabItem = {
  key: string;
  label: string;
  iconName: string;
};

const TABS: TabItem[] = [
  { key: '/', label: '홈', iconName: 'icon-home-mono' },
  { key: '/map', label: '지도', iconName: 'icon-map-mono' },
  { key: '/search', label: '검색', iconName: 'icon-search-mono' },
  { key: '/saved', label: '저장', iconName: 'icon-heart-mono' },
];

const SAKURA_ACTIVE = '#C45C7E';
const SAKURA_INACTIVE = '#B09099';

type TabBarProps = {
  currentRoute: string;
  onNavigate: (route: string) => void;
};

export function TabBar({ currentRoute, onNavigate }: TabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = currentRoute === tab.key;
        const color = isActive ? SAKURA_ACTIVE : SAKURA_INACTIVE;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onNavigate(tab.key)}
            accessibilityLabel={tab.label}
          >
            <Icon name={tab.iconName} size={22} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0D6E4',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
