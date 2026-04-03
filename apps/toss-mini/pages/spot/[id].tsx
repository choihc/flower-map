import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export const Route = createRoute('/spot/:id', {
  component: SpotDetailPage,
  validateParams: (params) => ({
    id: String((params as { id?: unknown }).id ?? ''),
  }),
});

function SpotDetailPage() {
  const params = Route.useParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>명소 상세</Text>
      <Text style={styles.id}>ID: {params.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  id: {
    fontSize: 14,
    color: '#718096',
  },
});
