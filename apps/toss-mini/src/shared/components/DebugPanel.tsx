import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type LogEntry = { level: 'log' | 'warn' | 'error'; message: string; time: string };

const logs: LogEntry[] = [];
const listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((fn) => fn());
}

// console 메서드를 가로채서 로그 수집
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

function formatArgs(args: unknown[]): string {
  return args
    .map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
    .join(' ');
}

function installInterceptor() {
  (['log', 'warn', 'error'] as const).forEach((level) => {
    (console as Record<string, unknown>)[level] = (...args: unknown[]) => {
      (originalConsole[level] as (...a: unknown[]) => void)(...args);
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      logs.push({ level, message: formatArgs(args), time });
      if (logs.length > 200) logs.shift();
      notify();
    };
  });
}

installInterceptor();

const LEVEL_COLOR: Record<LogEntry['level'], string> = {
  log: '#E0E0E0',
  warn: '#FFD166',
  error: '#FF6B8A',
};

export function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([...logs]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const refresh = () => setEntries([...logs]);
    listeners.push(refresh);
    return () => {
      const idx = listeners.indexOf(refresh);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [visible, entries.length]);

  return (
    <>
      {/* 우하단 토글 버튼 - 5번 탭해야 열림 */}
      <TapToOpen onOpen={() => setVisible(true)} />

      {visible && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Debug Log ({entries.length})</Text>
            <View style={styles.panelActions}>
              <Pressable onPress={() => { logs.length = 0; setEntries([]); }} hitSlop={8}>
                <Text style={styles.actionText}>지우기</Text>
              </Pressable>
              <Pressable onPress={() => setVisible(false)} hitSlop={8} style={{ marginLeft: 16 }}>
                <Text style={styles.actionText}>닫기</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView ref={scrollRef} style={styles.logScroll}>
            {entries.length === 0 && (
              <Text style={styles.empty}>로그 없음</Text>
            )}
            {entries.map((entry, i) => (
              <Text key={i} style={[styles.logLine, { color: LEVEL_COLOR[entry.level] }]}>
                <Text style={styles.logTime}>{entry.time} </Text>
                <Text style={styles.logLevel}>[{entry.level.toUpperCase()}] </Text>
                {entry.message}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
}

// 우하단 숨겨진 영역을 5번 탭하면 패널 오픈
function TapToOpen({ onOpen }: { onOpen: () => void }) {
  const countRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = () => {
    countRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countRef.current >= 5) {
      countRef.current = 0;
      onOpen();
    } else {
      timerRef.current = setTimeout(() => { countRef.current = 0; }, 1500);
    }
  };

  return (
    <Pressable style={styles.trigger} onPress={handlePress} />
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 44,
    height: 44,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 4, 7, 0.96)',
    zIndex: 9999,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3D1A27',
  },
  panelTitle: { color: '#FF6B8A', fontSize: 14, fontWeight: '700' },
  panelActions: { flexDirection: 'row' },
  actionText: { color: '#C45C7E', fontSize: 13 },
  logScroll: { flex: 1, padding: 12 },
  logLine: { fontSize: 11, lineHeight: 17, fontFamily: 'monospace', marginBottom: 2 },
  logTime: { color: '#5A3A47' },
  logLevel: { fontWeight: '700' },
  empty: { color: '#5A3A47', fontSize: 13, marginTop: 20, textAlign: 'center' },
});
