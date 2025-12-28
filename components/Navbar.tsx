"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { SignoutButton } from "@/components/SignoutButton";
import { MobileNav } from "@/components/MobileNav";

export default function Navbar() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { data: session } = useSession();

    const initial = session?.user?.name?.charAt(0).toUpperCase();

    return (
        <header>
            <nav>
                {/* Logo */}
                <Link href="/" className="logo">
                    <Image src="/icons/logo.png" alt="DevEvent Logo" width={24} height={24} />
                    <p>DevEvent</p>
                </Link>

                {/* Desktop links */}
                <ul className="hidden md:flex">
                    <Link href="/">Home</Link>
                    <Link href="/#events">Events</Link>
                    <Link href="/create-event">Create Event</Link>
                </ul>

                {/* Desktop auth */}
                {/* Desktop auth */}
                <div className="hidden md:flex items-center gap-4 relative">
                    {session ? (
                        <div className="relative">
                            {/* Profile letter */}
                            <div
                                className="h-8 w-8 rounded-full bg-primary text-black flex items-center justify-center text-sm font-semibold cursor-pointer select-none"
                                onClick={() => setProfileOpen(v => !v)}
                            >
                                {initial}
                            </div>

                            {/* Logout popup */}
                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-dark-100 border border-border-dark rounded-md shadow-lg z-50">
                                    <SignoutButton
                                        variant="ghost"
                                        className="w-full justify-start px-4 py-2"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/signin" className="bg-primary text-black px-4 py-2 rounded-md">
                            Sign In
                        </Link>
                    )}
                </div>
                {/* Mobile hamburger (unchanged) */}
                <button
                    onClick={() => setSidebarOpen(v => !v)}
                    className="md:hidden text-light-100 text-2xl leading-none"
                    aria-label="Toggle menu"
                >
                    ☰
                </button>
            </nav>

            {/* Mobile sidebar (unchanged) */}
            <MobileNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </header>
    );
}
