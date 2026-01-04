import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of routes to protect
const protectedRoutes = [
    "/create-event",
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only run auth check for protected routes
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        // Check for session cookie
        const session = request.cookies.get("next-auth.session-token") || request.cookies.get("__Secure-next-auth.session-token");
        if (!session) {
            // Redirect to signin page if not authenticated
            const url = request.nextUrl.clone();
            url.pathname = "/auth/signin";
            return NextResponse.redirect(url);
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/create-event",
    ],
};
