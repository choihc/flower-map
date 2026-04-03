import { AppsInToss } from '@apps-in-toss/framework';
import { getSchemeUri, InitialProps } from '@granite-js/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

// React Native 글로벌 에러 핸들러 (React 트리 밖 JS 에러 포함)
try {
  const errorUtils = (global as Record<string, unknown>).ErrorUtils as {
    getGlobalHandler: () => ((e: Error, fatal?: boolean) => void) | null;
    setGlobalHandler: (h: (e: Error, fatal?: boolean) => void) => void;
  } | undefined;
  if (errorUtils) {
    const prev = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      console.error(`[GlobalError][isFatal=${isFatal}]`, error?.message ?? String(error), error?.stack ?? '');
      prev?.(error, isFatal);
    });
  }
} catch (_) {
  // ErrorUtils를 사용할 수 없는 환경에서는 무시
}

import { context } from '../require.context';

// Toss 샌드박스 실제 스킴(intoss://)과 granite.config scheme 불일치 보정
const g = global as any;
if (g.__granite?.app) {
  const actualScheme = getSchemeUri()?.split('://')[0];
  if (actualScheme && actualScheme !== g.__granite.app.scheme) {
    g.__granite.app.scheme = actualScheme;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default AppsInToss.registerApp(AppContainer, { context });
