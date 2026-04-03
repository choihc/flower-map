const mockNavigate = () => {};
const mockGetState = () => ({ routes: [{ name: '/' }], index: 0 });

export const useNavigation = () => ({
  navigate: mockNavigate,
  getState: mockGetState,
});

export const getSchemeUri = () => 'intoss://flower-map';

export function createRoute(path: string, options: any) {
  return {
    _path: path,
    useNavigation: () => ({ navigate: mockNavigate }),
    useParams: () => ({}),
  };
}
