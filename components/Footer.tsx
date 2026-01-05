import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="glass">
            <div className="max-w-6xl mx-auto px-4 py-4 border-t border-border-dark">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                    <p className="text-xs text-gray-400">
                        © {currentYear} DevEvent. All rights reserved.
                    </p>
                    <div className="flex gap-4 text-xs">
                        <Link href="/events" className="text-gray-400 hover:text-white transition">
                            Events
                        </Link>
                        <Link href="/create-event" className="text-gray-400 hover:text-white transition">
                            Create Event
                        </Link>
                        <Link href="/my-bookings" className="text-gray-400 hover:text-white transition">
                            My Bookings
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
