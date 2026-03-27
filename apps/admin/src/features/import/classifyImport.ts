type WithSlug = {
  slug: string;
};

export function classifyImport<TIncoming extends WithSlug, TExisting extends WithSlug>(
  incomingRows: TIncoming[],
  existingRows: TExisting[],
) {
  const existingMap = new Map(existingRows.map((row) => [row.slug, row]));

  return incomingRows.reduce(
    (acc, row) => {
      const existing = existingMap.get(row.slug);

      if (existing) {
        acc.toUpdate.push({ incoming: row, existing });
      } else {
        acc.toCreate.push(row);
      }

      return acc;
    },
    {
      toCreate: [] as TIncoming[],
      toUpdate: [] as Array<{ incoming: TIncoming; existing: TExisting }>,
    },
  );
}
