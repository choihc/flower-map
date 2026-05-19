import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaysTabIndicator } from '../../src/features/stays/components/StaysTabIndicator';
import { useFeatureSeen } from '../../src/shared/lib/useFeatureSeen';
import { colors } from '../../src/shared/theme/colors';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { seen: staysSeen } = useFeatureSeen('stays');
  const showStaysDot = staysSeen === false;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        tabBarStyle: [styles.bar, { height: 60 + insets.bottom, paddingBottom: insets.bottom + 8 }],
        tabBarItemStyle: styles.item,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconFrame, focused ? styles.iconFrameActive : null]}>
              <Ionicons
                color={focused ? colors.primary : color}
                name={focused ? 'home' : 'home-outline'}
                size={20}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: '지도',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconFrame, focused ? styles.iconFrameActive : null]}>
              <Ionicons
                color={focused ? colors.primary : color}
                name={focused ? 'map' : 'map-outline'}
                size={20}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '검색',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconFrame, focused ? styles.iconFrameActive : null]}>
              <Ionicons
                color={focused ? colors.primary : color}
                name={focused ? 'search' : 'search-outline'}
                size={20}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stays"
        options={{
          title: '호캉스',
          tabBarAccessibilityLabel: showStaysDot ? '호캉스, 새 기능' : '호캉스',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconFrame, focused ? styles.iconFrameActive : null]}>
              <Ionicons
                color={focused ? colors.primary : color}
                name={focused ? 'bed' : 'bed-outline'}
                size={20}
              />
              <StaysTabIndicator seen={staysSeen} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: '더보기',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconFrame, focused ? styles.iconFrameActive : null]}>
              <Ionicons
                color={focused ? colors.primary : color}
                name={focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'}
                size={20}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(255, 249, 243, 0.96)',
    borderTopColor: '#E7DDD1',
    paddingTop: 8,
    position: 'absolute',
  },
  iconFrame: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  iconFrameActive: {
    backgroundColor: '#EEF4EA',
  },
  item: {
    paddingTop: 2,
  },
});
