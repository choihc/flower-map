type WithSlug = {
  slug: string;
};

type DuplicateGroup<TIncoming> = {
  slug: string;
  rows: TIncoming[];
};

export function classifyImport<TIncoming extends WithSlug, TExisting extends WithSlug>(
  incomingRows: TIncoming[],
  existingRows: TExisting[],
) {
  const existingMap = new Map(existingRows.map((row) => [row.slug, row]));
  const incomingGroups = new Map<string, TIncoming[]>();

  for (const row of incomingRows) {
    const rows = incomingGroups.get(row.slug);

    if (rows) {
      rows.push(row);
    } else {
      incomingGroups.set(row.slug, [row]);
    }
  }

  const duplicateSlugs = new Set<string>();
  const duplicates: DuplicateGroup<TIncoming>[] = [];

  for (const [slug, rows] of incomingGroups) {
    if (rows.length > 1) {
      duplicateSlugs.add(slug);
      duplicates.push({ slug, rows });
    }
  }

  return incomingRows.reduce(
    (acc, row) => {
      if (duplicateSlugs.has(row.slug)) {
        return acc;
      }

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
      duplicates,
    },
  );
}
