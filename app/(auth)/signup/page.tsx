"use client";

import { Suspense } from "react";
import { SignupForm } from "@/components/forms/SignupForm";

function SignupFormContent() {
    return <SignupForm />;
}

export default function SignupPage() {
    return (
        <main className=" flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                    <SignupFormContent />
                </Suspense>
            </div>
        </main>
    );
}