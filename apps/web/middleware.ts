import { NextResponse, type NextRequest } from 'next/server';

function isProtectedPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[middleware] ▶ invoked', {
    pathname,
    method: request.method,
    url: request.url,
    host: request.headers.get('host'),
    isProtected: isProtectedPath(pathname),
  });

  if (!isProtectedPath(pathname)) {
    console.log('[middleware] ✅ not protected, passing through');
    return NextResponse.next();
  }

  // Supabase 세션 쿠키 존재 여부만 확인 (실제 검증은 레이아웃에서 수행)
  const allCookies = request.cookies.getAll();
  const hasSession = allCookies.some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'),
  );

  console.log('[middleware] 🔒 protected route', {
    cookieCount: allCookies.length,
    cookieNames: allCookies.map((c) => c.name),
    hasSession,
  });

  if (!hasSession) {
    console.log('[middleware] 🔄 redirecting to /login');
    return redirectToLogin(request);
  }

  console.log('[middleware] ✅ session found, passing through');
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
