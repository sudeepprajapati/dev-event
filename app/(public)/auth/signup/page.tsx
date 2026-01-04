"use client";

import { useEffect } from "react";
import { SignupForm } from "@/components/forms/SignupForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/");
        }
    }, [status, router]);

    if (status === "authenticated") return null;

    return (
        <main className=" flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <SignupForm />
            </div>
        </main>
    );
}
