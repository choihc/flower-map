import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const Route = createRoute('/_404', {
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <View style={styles.page}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>페이지를 찾을 수 없습니다</Text>
      <Text style={styles.subtitle}>요청하신 페이지가 존재하지 않습니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  code: {
    color: '#5C9E66',
    fontSize: 64,
    fontWeight: '800',
    marginBottom: 12,
  },
  page: {
    alignItems: 'center',
    backgroundColor: '#F4F8F4',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  subtitle: {
    color: '#5E7262',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  title: {
    color: '#142218',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});
