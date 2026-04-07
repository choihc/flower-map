import { describe, expect, it } from 'vitest';

import { classifyImport } from './classifyImport';

describe('classifyImport', () => {
  it('splits rows into create and update buckets by slug', () => {
    const result = classifyImport(
      [
        { slug: 'yeouido-yunjung-ro', name: '여의도 윤중로' },
        { slug: 'jeju-noksan-ro', name: '제주 녹산로' },
      ],
      [{ slug: 'yeouido-yunjung-ro', name: '여의도 윤중로 기존 데이터' }],
    );

    expect(result.toCreate).toHaveLength(1);
    expect(result.toUpdate).toHaveLength(1);
    expect(result.toUpdate[0].existing.slug).toBe('yeouido-yunjung-ro');
  });

  it('routes duplicate incoming slugs into a duplicate bucket', () => {
    const result = classifyImport(
      [
        { slug: 'yeouido-yunjung-ro', name: '여의도 윤중로 1' },
        { slug: 'yeouido-yunjung-ro', name: '여의도 윤중로 2' },
        { slug: 'jeju-noksan-ro', name: '제주 녹산로' },
      ],
      [],
    );

    expect(result.toCreate).toHaveLength(1);
    expect(result.toUpdate).toHaveLength(0);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].slug).toBe('yeouido-yunjung-ro');
    expect(result.duplicates[0].rows).toHaveLength(2);
  });
});
