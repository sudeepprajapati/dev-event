"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { SignoutButton } from "@/components/SignoutButton";
import { Calendar, User, LogOut, Shield, X } from "lucide-react";

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
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-dark">
                    <span className="text-sm font-semibold">Menu</span>
                    <button onClick={onClose} className="text-gray-400">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <Link href="/" className="px-5 py-3 flex items-center gap-3" onClick={onClose}>
                    <Calendar className="h-4 w-4" />
                    Home
                </Link>
                <Link href="/#events" className="px-5 py-3 flex items-center gap-3" onClick={onClose}>
                    <Calendar className="h-4 w-4" />
                    Events
                </Link>
                <Link href="/create-event" className="px-5 py-3 flex items-center gap-3" onClick={onClose}>
                    <Calendar className="h-4 w-4" />
                    Create Event
                </Link>

                <div className="border-t border-border-dark my-2" />

                {session ? (
                    <>
                        <div className="px-5 py-2 text-sm text-gray-400">
                            Signed in as
                        </div>
                        <div className="px-5 py-1 text-sm font-semibold truncate flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {session.user?.email}
                        </div>
                        <Link href="/my-bookings" className="px-5 py-3 text-sm flex items-center gap-3" onClick={onClose}>
                            <Calendar className="h-4 w-4" />
                            My Bookings
                        </Link>
                        <Link href="/organizer/events" className="px-5 py-3 text-sm flex items-center gap-3" onClick={onClose}>
                            <Calendar className="h-4 w-4" />
                            Organizer Dashboard
                        </Link>
                        {session.user?.isAdmin && (
                            <Link href="/admin" className="px-5 py-3 text-sm text-purple-400 flex items-center gap-3" onClick={onClose}>
                                <Shield className="h-4 w-4" />
                                Admin Panel
                            </Link>
                        )}
                        <div className="border-t border-border-dark my-2" />
                        <div className="px-5 py-2 flex items-center gap-2">
                            <LogOut className="h-4 w-4 text-gray-400" />
                            <SignoutButton className="bg-red-500 text-white w-full" variant="ghost" />
                        </div>
                    </>
                ) : (
                    <Link href="/auth/signin" className="w-fit bg-primary text-black px-5 py-2 rounded-md">
                        Sign In
                    </Link>
                )}
            </nav>
        </div>
    );
}
