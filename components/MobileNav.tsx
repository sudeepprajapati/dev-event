"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { SignoutButton } from "@/components/SignoutButton";

type Props = {
    open: boolean;
    onClose: () => void;
};

export function MobileNav({ open, onClose }: Props) {
    const { data: session } = useSession();
    if (!open) return null;

    return (
        <div className="md:hidden border-t border-border-dark bg-dark-100">
            <nav className="flex flex-col py-2">
                <Link href="/" className="px-5 py-3" onClick={onClose}>
                    Home
                </Link>
                <Link href="/#events" className="px-5 py-3" onClick={onClose}>
                    Events
                </Link>
                <Link href="/create-event" className="px-5 py-3" onClick={onClose}>
                    Create Event
                </Link>

                <div className="border-t border-border-dark my-2" />

                {session ? (
                    <div className="px-5 py-3">
                        <SignoutButton className="bg-red-500 text-white" variant="ghost" />
                    </div>
                ) : (
                    <Link href="/signin" className="w-fit bg-primary text-black px-5 py-2 rounded-md">
                        Sign In
                    </Link>
                )}
            </nav>
        </div>
    );
}
