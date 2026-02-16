import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Check for missing environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Middleware: Missing Supabase environment variables');
        return response; // Fail open - allow request to proceed without session
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({ name, value, ...options });
                        response = NextResponse.next({
                            request: { headers: request.headers },
                        });
                        response.cookies.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({ name, value: '', ...options });
                        response = NextResponse.next({
                            request: { headers: request.headers },
                        });
                        response.cookies.set({ name, value: '', ...options });
                    },
                },
            }
        );

        // 2. Refresh session logic
        const protectedPaths = ['/profile', '/game', '/admin'];
        const authPaths = ['/login'];
        const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
        const isAuth = authPaths.some((path) => request.nextUrl.pathname.startsWith(path));

        if (isProtected || isAuth) {
            const { data, error } = await supabase.auth.getUser();
            const user = data?.user;

            if (error) {
                console.warn('Middleware: Supabase auth error', error.message);
            }

            if (isProtected && !user) {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
                return NextResponse.redirect(loginUrl);
            }

            if (isAuth && user) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
    } catch (err) {
        // 3. Prevent 500 errors by catching all exceptions
        console.error('Middleware execution failed:', err);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
