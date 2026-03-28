import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware-client';

const protectedPaths = ['/', '/settings'];
const protectedPrefixes = ['/flowers', '/spots'];

function isProtectedPath(pathname: string) {
  if (protectedPaths.includes(pathname)) {
    return true;
  }

  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { isAdmin, response, user } = await updateSession(request);

  if (!isProtectedPath(request.nextUrl.pathname) || (user != null && isAdmin)) {
    return response;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
