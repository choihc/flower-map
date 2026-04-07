import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function BootProbeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>꽃어디 부트 프로브</Text>
      <Text style={styles.description}>
        이 화면이 보이면 앱 부트스트랩은 성공입니다.
      </Text>
      <Text style={styles.caption}>
        현재 빌드는 기존 페이지 트리를 제외한 최소 구성입니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
    textAlign: 'center',
  },
  caption: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#666666',
    textAlign: 'center',
  },
});
