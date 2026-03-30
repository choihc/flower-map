import { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors } from '../theme/colors';

const titleImage = require('../../../assets/images/title.png');

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
      <ScrollView contentContainerStyle={styles.content}>
        {showBack && (
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </Pressable>
        )}
        <View style={styles.header}>
          <Image source={titleImage} style={styles.titleImage} />
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 12,
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

  titleImage: {
    alignSelf: 'center',
    height: 50,
    resizeMode: 'contain',
    width: 150,
  },
});
