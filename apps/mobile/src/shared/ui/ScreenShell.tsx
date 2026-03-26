import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type ScreenShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function ScreenShell({ title, subtitle, children }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={styles.blobRose} />
        <View style={styles.blobSand} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
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
    paddingBottom: 56,
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
