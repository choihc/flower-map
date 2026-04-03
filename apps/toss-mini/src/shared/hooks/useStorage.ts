import { Storage } from '@apps-in-toss/framework';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'saved-spots';

export function useStorage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    Storage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSavedIds(JSON.parse(raw));
        } catch {
          setSavedIds([]);
        }
      }
    });
  }, []);

  const save = useCallback(
    async (id: string) => {
      const next = [...savedIds, id];
      await Storage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedIds(next);
    },
    [savedIds],
  );

  const remove = useCallback(
    async (id: string) => {
      const next = savedIds.filter((sid) => sid !== id);
      await Storage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedIds(next);
    },
    [savedIds],
  );

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return { savedIds, save, remove, isSaved };
}
