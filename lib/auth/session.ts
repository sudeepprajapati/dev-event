import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);