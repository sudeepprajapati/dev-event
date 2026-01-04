import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "@/database/user.model";
import { comparePasswords } from "@/lib/auth/password";
import connectDB from "../mongodb";


export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Validate credentials are provided
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                try {
                    // Connect to database
                    await connectDB();

                    // Find user by email
                    const user = await User.findOne({
                        email: credentials.email.toLowerCase(),
                    }).select("+password");

                    if (!user) {
                        throw new Error("Invalid email or password");
                    }

                    // Compare passwords
                    const isPasswordValid = await comparePasswords(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        throw new Error("Invalid email or password");
                    }

                    // Return user object (without password)
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                    };
                } catch (error) {
                    console.error("Authorization error:", error);
                    throw new Error(
                        error instanceof Error ? error.message : "Authorization failed"
                    );
                }
            },
        }),
    ],
    pages: {
        signIn: "/auth/signin",
        error: "/auth/signin",
    },
    callbacks: {
        /**
         * JWT callback - called whenever a JWT is created or updated
         * Add user info to the JWT token
         */
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },

        /**
         * Session callback - called whenever session is checked
         * Add user info to the session
         */
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.isAdmin = token.email === process.env.ADMIN_EMAIL;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};
