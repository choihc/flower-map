import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TabItem = {
  key: string;
  label: string;
  icon: string;
};

const TABS: TabItem[] = [
  { key: '/', label: '홈', icon: '🏠' },
  { key: '/map', label: '지도', icon: '🗺️' },
  { key: '/search', label: '검색', icon: '🔍' },
  { key: '/saved', label: '저장', icon: '❤️' },
];

type TabBarProps = {
  currentRoute: string;
  onNavigate: (route: string) => void;
};

export function TabBar({ currentRoute, onNavigate }: TabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = currentRoute === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onNavigate(tab.key)}
            accessibilityLabel={tab.label}
          >
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
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
    borderTopColor: '#E7DDD1',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    color: '#888888',
  },
  activeLabel: {
    color: '#5C9E66',
    fontWeight: '600',
  },
});
