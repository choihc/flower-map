/**
 * 입력 배열을 최대 `limit` 동시 처리로 매핑한다.
 * - 결과 배열은 입력과 같은 인덱스 순서로 채워진다.
 * - 어느 한 작업이라도 reject하면 전체 실행이 reject된다(첫 실패 전파).
 * - limit <= 0이면 TypeError를 던진다.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new TypeError(`mapWithConcurrency: limit은 1 이상의 정수여야 합니다 (받은 값: ${limit})`);
  }
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}
