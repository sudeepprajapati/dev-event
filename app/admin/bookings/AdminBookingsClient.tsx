'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AdminBookingsClientProps {
    eventFilter: string;
}

export default function AdminBookingsClient({ eventFilter }: AdminBookingsClientProps) {
    const router = useRouter();

    const [bookings, setBookings] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const res = await fetch(`/api/admin/bookings${eventFilter ? `?event=${eventFilter}` : ""}`);
            if (!res.ok) {
                router.replace("/auth/signin");
                return;
            }
            const data = await res.json();
            setBookings(data.bookings);
            setEvents(data.events);
            setStats(data.stats);
            setLoading(false);
        };

        fetchData();
    }, [eventFilter, router]);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <main className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 text-gray-400 hover:text-foreground transition"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Admin
                </Link>
                <h1 className="text-3xl font-bold">Booking Management</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Stat label="Total Bookings" value={stats.totalBookings} />
                <Stat label="Paid" value={stats.paidBookings} className="text-green-600" />
                <Stat label="Pending" value={stats.pendingBookings} className="text-yellow-600" />
                <Stat label="Revenue" value={`₹${stats.totalRevenue}`} />
            </div>

            <select
                value={eventFilter}
                onChange={(e) =>
                    router.replace(e.target.value ? `?event=${e.target.value}` : "/admin/bookings")
                }
                className="mb-6 bg-dark-200 rounded-lg px-4 py-2 text-sm border border-border-dark"
            >
                <option value="">All Events</option>
                {events.map((e) => (
                    <option key={e._id} value={e._id}>
                        {e.title}
                    </option>
                ))}
            </select>

            <div className="overflow-x-auto glass rounded-lg">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border-dark">
                            <th className="p-4 text-left">Booking ID</th>
                            <th className="p-4 text-left">Email</th>
                            <th className="p-4 text-left">Event</th>
                            <th className="p-4 text-left">Amount</th>
                            <th className="p-4 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    No bookings found.
                                </td>
                            </tr>
                        ) : (
                            bookings.map((b) => (
                                <tr key={b._id} className="border-b border-border-dark">
                                    <td className="p-4 font-mono text-xs">{b._id.slice(0, 12)}...</td>
                                    <td className="p-4">{b.email}</td>
                                    <td className="p-4">{b.eventId?.title}</td>
                                    <td className="p-4">₹{b.amount}</td>
                                    <td className="p-4">{b.paymentStatus}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}

function Stat({ label, value, className = "" }: any) {
    return (
        <div className="glass rounded-lg p-4">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`text-2xl font-bold ${className}`}>{value}</p>
        </div>
    );
}
