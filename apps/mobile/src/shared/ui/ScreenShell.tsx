import { ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors } from '../theme/colors';

type ScreenShellProps = {
  title: string;
  subtitle?: string;
  titleColor?: string;
  showBack?: boolean;
  children?: ReactNode;
};

export function ScreenShell({ title, subtitle, titleColor, showBack, children }: ScreenShellProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={styles.blobRose} />
        <View style={styles.blobSand} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {showBack && (
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </Pressable>
        )}
        <View style={styles.header}>
          <Text style={[styles.title, titleColor ? { color: titleColor } : null]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  blobRose: {
    backgroundColor: '#FAE2E6',
    borderRadius: 999,
    height: 220,
    opacity: 0.65,
    position: 'absolute',
    right: -60,
    top: -20,
    width: 220,
  },
  blobSand: {
    backgroundColor: colors.backgroundTint,
    borderRadius: 999,
    bottom: 120,
    height: 180,
    left: -70,
    opacity: 0.6,
    position: 'absolute',
    width: 180,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  backButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 28,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 280,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
});
