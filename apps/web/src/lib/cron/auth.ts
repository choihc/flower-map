export function verifyCronAuth(req: Request): boolean {
  const header = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length === 0) {
    return false;
  }
  return header === `Bearer ${expected}`;
}
