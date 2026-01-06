'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Users, DollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminBookingsClientProps {
    eventFilter: string;
}

export default function AdminBookingsClient({
    eventFilter: initialEventFilter,
}: AdminBookingsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventFilter = searchParams.get("event") || initialEventFilter;

    const [bookings, setBookings] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const res = await fetch(
                `/api/admin/bookings${eventFilter ? `?event=${eventFilter}` : ""}`
            );

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

    return (
        <section className="max-w-7xl w-full mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 text-gray-400 hover:text-foreground transition"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Admin
                </Link>

                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <BookOpen className="h-8 w-8" />
                    Booking Management
                </h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Total Bookings"
                    value={stats?.totalBookings || 0}
                    icon={<BookOpen className="h-6 w-6" />}
                />
                <StatCard
                    label="Paid Bookings"
                    value={stats?.paidBookings || 0}
                    icon={<Calendar className="h-6 w-6 text-green-400" />}
                />
                <StatCard
                    label="Pending Bookings"
                    value={stats?.pendingBookings || 0}
                    icon={<Users className="h-6 w-6 text-yellow-400" />}
                />
                <StatCard
                    label="Total Revenue"
                    value={`₹${stats?.totalRevenue || 0}`}
                    icon={<DollarSign className="h-6 w-6" />}
                />
            </div>

            {/* Filter */}
            <div className="glass rounded-lg p-4 mb-6 flex items-center gap-4 max-w-xs">
                <Calendar className="h-5 w-5 text-gray-400" />
                <Select
                    value={eventFilter || "all"}
                    onValueChange={(val) =>
                        router.replace(val === "all" ? "/admin/bookings" : `/admin/bookings?event=${val}`)
                    }
                >
                    <SelectTrigger className="bg-transparent border-none outline-none text-foreground p-0 h-auto focus:ring-0">
                        <SelectValue placeholder="Filter by event" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-100 border-border-dark text-white">
                        <SelectItem value="all">All Events</SelectItem>
                        {events.map((e) => (
                            <SelectItem key={e._id} value={e._id}>
                                <span className="truncate max-w-75 md:w-full">{e.title}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Mobile View (Cards) */}
            <div className="flex flex-col gap-4 md:hidden">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-lg bg-dark-200" />
                    ))
                ) : bookings.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                        No bookings found
                    </div>
                ) : (
                    bookings.map((b) => (
                        <Card key={b._id} className="glass">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="font-mono text-xs text-gray-400">
                                        {b._id.slice(0, 10)}...
                                    </p>
                                    <StatusBadge status={b.paymentStatus} />
                                </div>

                                <p className="text-sm">{b.email}</p>
                                <p className="text-sm text-gray-400">
                                    {b.eventId?.title}
                                </p>

                                <p className="font-semibold">
                                    ₹{b.amount}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block overflow-x-auto glass rounded-lg">
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
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-border-dark">
                                    <td colSpan={5}>
                                        <Skeleton className="h-12 w-full bg-dark-200" />
                                    </td>
                                </tr>
                            ))
                        ) : bookings.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    No bookings found
                                </td>
                            </tr>
                        ) : (
                            bookings.map((b) => (
                                <tr key={b._id} className="border-b border-border-dark">
                                    <td className="p-4 font-mono text-xs text-gray-400">
                                        {b._id.slice(0, 12)}...
                                    </td>
                                    <td className="p-4">{b.email}</td>
                                    <td className="p-4">{b.eventId?.title}</td>
                                    <td className="p-4">₹{b.amount}</td>
                                    <td className="p-4">
                                        <StatusBadge status={b.paymentStatus} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {stats && bookings.length > 0 && (
                <div className="mt-6 text-sm text-gray-400">
                    Showing {bookings.length} of {stats.totalBookings} bookings
                </div>
            )}
        </section>
    );
}

/* ---------------------------- */
/* Helpers */
/* ---------------------------- */

function StatCard({
    label,
    value,
    icon,
}: { label: string; value: string | number; icon: React.ReactNode }) {
    return (
        <div className="glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">{label}</p>
                {icon}
            </div>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const base = "capitalize";

    if (status === "paid") {
        return (
            <Badge className={`${base} bg-green-500/15 text-green-400 border border-green-500/30`}>
                paid
            </Badge>
        );
    }

    if (status === "pending") {
        return (
            <Badge className={`${base} bg-yellow-500/15 text-yellow-400 border border-yellow-500/30`}>
                pending
            </Badge>
        );
    }

    return (
        <Badge variant="secondary" className={base}>
            {status}
        </Badge>
    );
}
