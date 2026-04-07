import { AppsInToss } from '@apps-in-toss/framework';
import { InitialProps } from '@granite-js/react-native';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

import { context } from '../require.context';
import { AppErrorBoundary } from './shared/components/AppErrorBoundary';

Sentry.init({
  dsn: 'https://17dd44e72929ede5c284e17ab9d988ce@o4511173458657280.ingest.us.sentry.io/4511173460361216',
  enableNative: false,
  debug: __DEV__,
});

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
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default AppsInToss.registerApp(AppContainer, { context });
