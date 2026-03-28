import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = ['/', '/settings'];
const protectedPrefixes = ['/flowers', '/spots'];

function isProtectedPath(pathname: string) {
  if (protectedPaths.includes(pathname)) return true;
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Supabase 세션 쿠키 존재 여부만 확인 (실제 검증은 레이아웃에서 수행)
  const hasSession = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'),
  );

  if (!hasSession) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
