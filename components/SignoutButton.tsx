"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SignoutButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    className?: string;
}

export function SignoutButton({
    variant = "ghost",
    className = "",
}: SignoutButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignout() {
        try {
            setIsLoading(true);
            // Sign out and redirect to home page
            await signOut({ redirect: true, callbackUrl: "/" });
        } catch (error) {
            console.error("Signout error:", error);
            // Fallback: redirect manually if signOut fails
            router.push("/");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Button
            onClick={handleSignout}
            disabled={isLoading}
            variant={variant}
            className={className}
        >
            {isLoading ? "Signing out..." : "Sign Out"}
        </Button>
    );
}
