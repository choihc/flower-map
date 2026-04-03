declare module 'react-test-renderer' {
  export const act: (callback: () => void) => void;
  export interface ReactTestRenderer {
    root: {
      findAllByType(type: unknown): Array<{ props: Record<string, unknown> }>;
      findByType(type: unknown): { props: Record<string, unknown> };
    };
  }
  const TestRenderer: {
    create(node: React.ReactNode): ReactTestRenderer;
  };
  export default TestRenderer;
}
