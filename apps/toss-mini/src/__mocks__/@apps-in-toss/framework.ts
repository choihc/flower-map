import { vi } from 'vitest';

export const Storage = {
  getItem: vi.fn(async (_key: string): Promise<string | null> => null),
  setItem: vi.fn(async (_key: string, _value: string): Promise<void> => {}),
  removeItem: vi.fn(async (_key: string): Promise<void> => {}),
};
