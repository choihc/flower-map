export const useRouter = () => ({
  back: () => {},
  push: () => {},
  replace: () => {},
  navigate: () => {},
  canGoBack: () => false,
});

export const useLocalSearchParams = () => ({});
export const useGlobalSearchParams = () => ({});
export const useSegments = () => [];
export const usePathname = () => '/';
export const useNavigation = () => ({});
export const Link = ({ children }: { children: React.ReactNode }) => children;
export const Redirect = () => null;
export const Stack = { Screen: () => null };
export const Tabs = { Screen: () => null };

export default { useRouter };
