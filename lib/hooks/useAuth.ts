"use client";

import { useSession, SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

/**
 * Hook to get current user session
 * Only use in client components wrapped with SessionProvider
 * @returns Session object with user data
 */
export function useAuth() {
    const { data: session, status, update } = useSession();

    return {
        session,
        status,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
        isUnauthenticated: status === "unauthenticated",
        user: session?.user,
        update,
    };
}

/**
 * Type-safe session type
 */
export type AuthSession = Session & {
    user: {
        id: string;
        email: string;
        name: string;
    };
};
