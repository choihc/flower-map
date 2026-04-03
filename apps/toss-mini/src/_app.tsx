import { AppsInToss } from '@apps-in-toss/framework';
import { getSchemeUri, InitialProps } from '@granite-js/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

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
