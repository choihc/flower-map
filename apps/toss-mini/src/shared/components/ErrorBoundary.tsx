import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>런타임 오류 발생</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => this.setState({ error: null })}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.errorName}>{error.name}</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          {Boolean(error.stack) && (
            <Text style={styles.stack}>{error.stack}</Text>
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0A0F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3D1A27',
  },
  title: { color: '#FF6B8A', fontSize: 16, fontWeight: '700' },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#C45C7E',
    borderRadius: 8,
  },
  retryText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 8 },
  errorName: { color: '#FF6B8A', fontSize: 14, fontWeight: '700' },
  errorMessage: { color: '#FFB3C6', fontSize: 13, lineHeight: 20 },
  stack: { color: '#8B5A6E', fontSize: 11, lineHeight: 16, marginTop: 8 },
});
