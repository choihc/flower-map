export function shardIndex(spotId: string, totalShards = 7): number {
  let hash = 0;
  for (let i = 0; i < spotId.length; i++) {
    hash = (hash * 31 + spotId.charCodeAt(i)) | 0;
  }
  // Math.abs(-2^31)은 -2^31 그대로라 음수 인덱스가 생길 수 있다.
  // unsigned 32bit 변환(>>> 0)으로 0..2^32-1 범위를 보장한다.
  return (hash >>> 0) % totalShards;
}

export function todayShard(now = new Date(), totalShards = 7): number {
  return now.getUTCDay() % totalShards;
}
