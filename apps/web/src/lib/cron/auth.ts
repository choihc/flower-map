import { timingSafeEqual } from 'node:crypto';

export function verifyCronAuth(req: Request): boolean {
  const header = req.headers.get('authorization') ?? '';
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length === 0) {
    return false;
  }
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
