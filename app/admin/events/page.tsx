'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, DollarSign, Users, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
    _id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    mode: string;
    price: number;
    image: string;
    organizerEmail: string;
    organizerName: string;
    stats: {
        totalBookings: number;
    };
}

interface Stats {
    totalEvents: number;
    totalRevenue: number;
}

export default function AdminEventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/events');
            if (!res.ok) {
                router.replace('/auth/signin');
                return;
            }
            const data = await res.json();
            setEvents(data.events);
            setStats(data.stats);
        } catch {
            router.replace('/auth/signin');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (eventId: string, eventTitle: string) => {
        toast(`Delete "${eventTitle}"?`, {
            description: "This will also delete all its bookings.",
            action: {
                label: "Delete",
                onClick: async () => {
                    setDeletingId(eventId);
                    try {
                        const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' });
                        if (!res.ok) {
                            toast.error('Failed to delete event');
                            return;
                        }
                        toast.success('Event deleted successfully');
                        await fetchEvents();
                    } catch {
                        toast.error('Error deleting event');
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        });
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <main className="max-w-7xl mx-auto py-8 px-4">
                <div className="text-center">Loading...</div>
            </main>
        );
    }

    return (
        <section className="max-w-7xl w-full mx-auto ">
            <div className="flex items-center gap-4 mb-8 ">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 text-gray-400 hover:text-foreground transition"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Admin
                </Link>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Calendar className="h-8 w-8" />
                    Events Management
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatCard
                    label="Total Events"
                    value={stats?.totalEvents || 0}
                    icon={<Calendar className="h-6 w-6" />}
                />
                <StatCard
                    label="Total Revenue"
                    value={`₹${stats?.totalRevenue || 0}`}
                    icon={<DollarSign className="h-6 w-6" />}
                />
                <StatCard
                    label="Active Organizers"
                    value={new Set(events.map(e => e.organizerEmail)).size}
                    icon={<Users className="h-6 w-6" />}
                />
            </div>

            <div className="glass rounded-lg p-4 mb-6 flex items-center gap-4">
                <ImageIcon className="h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search events by title or organizer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-foreground"
                />
            </div>

            <div className="overflow-x-auto glass rounded-lg">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border-dark">
                            <th className="p-4 text-left">Event</th>
                            <th className="p-4 text-left">Organizer</th>
                            <th className="p-4 text-left">Date</th>
                            <th className="p-4 text-left">Price</th>
                            <th className="p-4 text-left">Bookings</th>
                            <th className="p-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">
                                    No events found
                                </td>
                            </tr>
                        ) : (
                            filteredEvents.map((event) => (
                                <tr key={event._id} className="border-b border-border-dark">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="h-12 w-12 rounded object-cover"
                                            />
                                            <span className="font-medium max-w-xs truncate">{event.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300">
                                        <div className="text-xs">
                                            <p className="font-medium">{event.organizerName}</p>
                                            <p className="text-gray-500">{event.organizerEmail}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-400">
                                        {event.date}
                                    </td>
                                    <td className="p-4">
                                        <span className={event.price === 0 ? 'text-green-600' : 'text-primary'}>
                                            {event.price === 0 ? 'FREE' : `₹${event.price}`}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {event.stats.totalBookings}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(event._id, event.title)}
                                            disabled={deletingId === event._id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {deletingId === event._id ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {stats && filteredEvents.length > 0 && (
                <div className="mt-6 text-sm text-gray-400">
                    Showing {filteredEvents.length} of {stats.totalEvents} events
                </div>
            )}
        </section>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
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
