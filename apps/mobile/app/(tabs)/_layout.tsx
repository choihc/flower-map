import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../src/shared/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDeep,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
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
                color={focused ? colors.primaryDeep : color}
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
                color={focused ? colors.primaryDeep : color}
                name={focused ? 'map' : 'map-outline'}
                size={20}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: '저장',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconFrame, focused ? styles.iconFrameActive : null]}>
              <Ionicons
                color={focused ? colors.primaryDeep : color}
                name={focused ? 'heart' : 'heart-outline'}
                size={20}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '내 정보',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconFrame, focused ? styles.iconFrameActive : null]}>
              <Ionicons
                color={focused ? colors.primaryDeep : color}
                name={focused ? 'person' : 'person-outline'}
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
    height: 86,
    paddingBottom: 12,
    paddingTop: 10,
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
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
