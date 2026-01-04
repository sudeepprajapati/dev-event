'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-dark-100 border-t border-border-dark mt-20">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">DevEvent</h3>
                        <p className="text-sm text-gray-400">
                            Discover and book amazing developer events near you.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link href="/" className="hover:text-white transition">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/#events" className="hover:text-white transition">
                                    Browse Events
                                </Link>
                            </li>
                            <li>
                                <Link href="/create-event" className="hover:text-white transition">
                                    Create Event
                                </Link>
                            </li>
                            <li>
                                <Link href="/my-bookings" className="hover:text-white transition">
                                    My Bookings
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Organizers */}
                    <div>
                        <h4 className="font-semibold mb-4">For Organizers</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link href="/organizer/events" className="hover:text-white transition">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/create-event" className="hover:text-white transition">
                                    Host Event
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <a href="mailto:support@devevents.com" className="hover:text-white transition">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition">
                                    FAQ
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border-dark pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-gray-400">
                            © 2025 DevEvent. All rights reserved.
                        </p>
                        <div className="flex gap-6 mt-4 md:mt-0 text-sm text-gray-400">
                            <a href="#" className="hover:text-white transition">
                                Privacy Policy
                            </a>
                            <a href="#" className="hover:text-white transition">
                                Terms of Service
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
