"use client";

import { Suspense } from "react";
import { SigninForm } from "@/components/forms/SigninForm";

function SigninFormContent() {
    return <SigninForm />;
}

export default function SigninPage() {
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
