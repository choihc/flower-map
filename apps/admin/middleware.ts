import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = ['/', '/settings'];
const protectedPrefixes = ['/flowers', '/spots'];

function isProtectedPath(pathname: string) {
  if (protectedPaths.includes(pathname)) return true;
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function isAdminUser(supabase: ReturnType<typeof createServerClient>, userId: string) {
  try {
    const { data } = await (supabase.from('admin_users') as any)
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    return data != null;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return redirectToLogin(request);
    }

    let response = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user == null ? false : await isAdminUser(supabase, user.id);

    if (!isProtectedPath(request.nextUrl.pathname) || (user != null && isAdmin)) {
      return response;
    }

    return redirectToLogin(request);
  } catch {
    // 미들웨어 오류 시 로그인 페이지로 안전하게 리다이렉트
    return redirectToLogin(request);
  }
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
