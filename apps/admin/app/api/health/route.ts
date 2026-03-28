import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[health] ▶ health check invoked');
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    runtime: process.env.NEXT_RUNTIME ?? 'unknown',
    nodeVersion: process.version,
  });
}
