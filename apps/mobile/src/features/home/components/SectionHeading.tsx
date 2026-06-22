import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';

export function SectionHeading({ meta, title }: { meta?: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {meta && <Text style={styles.sectionMeta}>{meta}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 18,
    textAlign: 'right',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
