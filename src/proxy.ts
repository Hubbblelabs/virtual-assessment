import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Paths that don't require authentication
const publicPaths = [
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/' // Landing page
];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the path is public
    if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
        return NextResponse.next();
    }

    // Check for token in headers (API) or cookies (Frontend)
    let token = request.headers.get('Authorization')?.substring(7);

    // If no bearer token, check cookies (common for fullstack next apps)
    if (!token) {
        token = request.cookies.get('token')?.value;
    }

    if (!token) {
        // Redirect to login for page requests, JSON for API
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Role based protection could go here if needed, but keeping it simple for now
    // Add user info to headers for downstream use if needed, though lib/auth.ts handles extraction usually

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder content
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};
