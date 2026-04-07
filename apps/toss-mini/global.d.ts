declare global {
  namespace NodeJS {
    interface Require {
      context(path: string, useSubdirectories: boolean, regExp: RegExp): {
        keys(): string[];
        (id: string): unknown;
        resolve(id: string): string;
        id: string;
      };
    }
  }
}

declare module '@granite-js/react-native' {
  interface RegisterScreenInput {
    '/': undefined;
    '/map': undefined;
    '/saved': undefined;
    '/search': undefined;
    '/_404': undefined;
    '/spot/:id': { id: string };
  }

  interface RegisterScreen {
    '/': undefined;
    '/map': undefined;
    '/saved': undefined;
    '/search': undefined;
    '/_404': undefined;
    '/spot/:id': { id: string };
  }
}

export {};
