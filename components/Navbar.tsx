"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { SignoutButton } from "@/components/SignoutButton";
import { MobileNav } from "@/components/MobileNav";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { data: session } = useSession();

    const initial = session?.user?.name?.charAt(0).toUpperCase();

    return (
        <header>
            <nav>
                <Link href="/" className="logo">
                    <Image src="/icons/logo.png" alt="DevEvent Logo" width={24} height={24} />
                    <p>DevEvent</p>
                </Link>

                <ul className="hidden md:flex">
                    <Link href="/">Home</Link>
                    <Link href="/#events">Events</Link>
                    <Link href="/create-event">Create Event</Link>
                </ul>

                <div className="hidden md:flex items-center gap-4 relative">
                    {session ? (
                        <div className="relative">
                            <div
                                className="h-8 w-8 rounded-full bg-primary text-black flex items-center justify-center text-sm font-semibold cursor-pointer select-none"
                                onClick={() => setProfileOpen(v => !v)}
                            >
                                {initial}
                            </div>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-dark-100 border border-border-dark rounded-md shadow-lg z-50">
                                    <div className="px-4 py-3 border-b border-border-dark">
                                        <p className="text-sm text-gray-400">Signed in as</p>
                                        <p className="text-sm font-semibold truncate">{session.user?.email}</p>
                                    </div>

                                    <div className="py-2">
                                        <Link
                                            href="/my-bookings"
                                            className="block px-4 py-2 text-sm hover:bg-dark-200 transition"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            My Bookings
                                        </Link>
                                        <Link
                                            href="/organizer/events"
                                            className="block px-4 py-2 text-sm hover:bg-dark-200 transition"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            Organizer Dashboard
                                        </Link>
                                        {session.user?.isAdmin && (
                                            <Link
                                                href="/admin"
                                                className="block px-4 py-2 text-sm hover:bg-dark-200 transition text-purple-400"
                                                onClick={() => setProfileOpen(false)}
                                            >
                                                Admin Panel
                                            </Link>
                                        )}
                                        <hr className="border-border-dark my-2" />
                                        <SignoutButton
                                            variant="ghost"
                                            className="w-full justify-start px-4 py-2 cursor-pointer hover:bg-dark-200 hover:text-red-500 text-red-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/auth/signin" className="bg-primary text-black px-4 py-2 rounded-md">
                            Sign In
                        </Link>
                    )}
                </div>

                <button
                    onClick={() => setSidebarOpen(v => !v)}
                    className="md:hidden text-light-100 text-2xl leading-none"
                    aria-label="Toggle menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </nav>

            <MobileNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </header>
    );
}
