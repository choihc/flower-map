export function shardIndex(spotId: string, totalShards = 7): number {
  let hash = 0;
  for (let i = 0; i < spotId.length; i++) {
    hash = (hash * 31 + spotId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % totalShards;
}

export function todayShard(now = new Date(), totalShards = 7): number {
  return now.getUTCDay() % totalShards;
}
