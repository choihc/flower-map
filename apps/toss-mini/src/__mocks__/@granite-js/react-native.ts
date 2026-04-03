const mockNavigate = () => {};
const mockGoBack = () => {};
const mockGetState = () => ({ routes: [{ name: '/' }], index: 0 });

export const useNavigation = () => ({
  navigate: mockNavigate,
  goBack: mockGoBack,
  getState: mockGetState,
});

export const getSchemeUri = () => 'intoss://flower-map';

export const openURL = () => Promise.resolve();

export function createRoute(path: string, options: any) {
  return {
    _path: path,
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
    useParams: () => ({}),
  };
}
