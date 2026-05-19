// mock for expo-clipboard in vitest
export const setStringAsync = async (_text: string): Promise<void> => {};
export const getStringAsync = async (): Promise<string> => '';
export const hasStringAsync = async (): Promise<boolean> => false;
