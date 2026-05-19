import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../shared/theme/colors';

const CARD_HEIGHT = 132;
const MOTION_DURATION_MS = 220;

type StaysDiscoveryCardProps = {
  onPress: () => void;
  onDismiss: () => void;
};

export function StaysDiscoveryCard({ onPress, onDismiss }: StaysDiscoveryCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const collapseHeight = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const [hidden, setHidden] = useState(false);
  const reduceMotionRef = useRef(false);
  const dismissingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((reduce) => {
        if (cancelled) return;
        reduceMotionRef.current = reduce;
        if (reduce) {
          opacity.setValue(1);
          translateY.setValue(0);
          return;
        }
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: MOTION_DURATION_MS,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: MOTION_DURATION_MS,
            useNativeDriver: true,
          }),
        ]).start();
      })
      .catch(() => {
        opacity.setValue(1);
        translateY.setValue(0);
      });
    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
  }, [opacity, translateY]);

  const handleDismiss = () => {
    // 빠른 중복 탭/애니메이션 진행 중 재진입 차단.
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    if (reduceMotionRef.current) {
      if (isMountedRef.current) setHidden(true);
      onDismiss();
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: MOTION_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(collapseHeight, {
        toValue: 0,
        duration: MOTION_DURATION_MS,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // 애니메이션 완료 후에 hidden + onDismiss 호출 — 부모 markSeen으로 인한 즉시
      // unmount에 의해 exit 애니메이션이 점프 컷되는 race를 차단한다.
      if (isMountedRef.current) setHidden(true);
      onDismiss();
    });
  };

  if (hidden) return null;

  return (
    <Animated.View style={[styles.outer, { height: collapseHeight, opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ translateY }] }]}>
        <View style={styles.accentStripe} pointerEvents="none" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이번 주말, 호캉스 어디 갈까? 호캉스 보기"
          onPress={onPress}
          style={styles.pressableBody}
          testID="stays-discovery-card"
        >
          <View style={styles.iconBox}>
            <Ionicons color="#FFFFFF" name="bed" size={22} />
          </View>
          <View style={styles.body}>
            <View style={styles.badgeRow}>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              이번 주말, 호캉스 어디 갈까?
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              꽃 시즌 사이, 도심 속 휴식 15곳
            </Text>
          </View>
          <View style={styles.ctaPill}>
            <Text style={styles.ctaText}>호캉스 보기 →</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel="발견 카드 닫기"
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleDismiss}
          style={styles.dismissHit}
          testID="stays-discovery-card-dismiss"
        >
          <View style={styles.dismissCircle}>
            <Ionicons color="rgba(255,255,255,0.85)" name="close" size={14} />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  accentStripe: {
    backgroundColor: colors.accentGold,
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  body: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.inkDeep,
    borderRadius: 28,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingRight: 22,
    paddingVertical: 16,
  },
  ctaPill: {
    backgroundColor: colors.accentGold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaText: {
    color: colors.inkDeep,
    fontSize: 12,
    fontWeight: '800',
  },
  dismissCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dismissHit: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 44,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 14,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  newBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    color: colors.inkDeep,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  outer: {
    marginBottom: 18,
    overflow: 'hidden',
  },
  pressableBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    height: '100%',
    paddingRight: 36,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
});
