import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { ScreenShell } from '../../../shared/ui/ScreenShell';

type MenuItem = {
  key: 'saved' | 'me';
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/saved' | '/me';
};

const MENU_ITEMS: readonly MenuItem[] = [
  {
    key: 'saved',
    label: '좋아요한 명소',
    description: '내가 좋아요 누른 꽃 명소 모아보기',
    icon: 'heart-outline',
    href: '/saved',
  },
  {
    key: 'me',
    label: '내 정보',
    description: '로그인·계정 설정',
    icon: 'person-outline',
    href: '/me',
  },
];

export function MoreScreen() {
  const router = useRouter();

  return (
    <ScreenShell titleText="더보기" subtitle="저장한 명소와 내 정보를 한 곳에서 관리해요.">
      <View style={styles.menuList}>
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [styles.menuRow, pressed ? styles.menuRowPressed : null]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={styles.menuIconFrame}>
              <Ionicons color={colors.primary} name={item.icon} size={20} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
          </Pressable>
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  menuList: {
    gap: 12,
    paddingHorizontal: 4,
  },
  menuRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuRowPressed: {
    opacity: 0.7,
  },
  menuIconFrame: {
    alignItems: 'center',
    backgroundColor: '#EEF4EA',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  menuTextGroup: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  menuDescription: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
