import { DefaultSession } from "next-auth";

export interface SignupFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface SigninFormData {
    email: string;
    password: string;
}

/**
 * Module augmentation for next-auth
 * Extends the built-in Session type with custom user properties
 */
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        name: string;
        email: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        email: string;
        name: string;
    }
}
