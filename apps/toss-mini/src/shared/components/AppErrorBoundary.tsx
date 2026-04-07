import * as Sentry from '@sentry/react-native';
import React, { Component, ErrorInfo, PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[toss-mini] uncaught render error', error, errorInfo.componentStack);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  render() {
    const { error } = this.state;

    if (error != null) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>앱을 불러오는 중 문제가 발생했어요</Text>
          <Text style={styles.message}>{error.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#111111',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },
});
