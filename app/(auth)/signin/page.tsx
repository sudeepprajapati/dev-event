"use client";

import { Suspense, useEffect } from "react";
import { SigninForm } from "@/components/forms/SigninForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function SigninFormContent() {
    return <SigninForm />;
}

export default function SigninPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/");
        }
    }, [status, router]);

    if (status === "authenticated") return null;

    return (
        <main className="flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                    <SigninFormContent />
                </Suspense>
            </div>
        </main>
    );
}
