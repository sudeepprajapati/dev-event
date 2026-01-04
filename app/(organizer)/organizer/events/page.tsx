import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import Link from 'next/link';
import { Metadata } from 'next';
import DeleteEventButton from '@/components/DeleteEventButton';
import { getUserByEmail } from '@/lib/actions/auth.action';
import { getEventsByOrganizerId } from '@/lib/actions/event.action';
import { Calendar, Clock, MapPin, IndianRupee } from 'lucide-react';

export const metadata: Metadata = {
    title: 'My Events - Organizer Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function OrganizerEventsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect('/auth/signin');

    const organizer = await getUserByEmail(session.user.email);
    if (!organizer) redirect('/auth/signin');

    const safeEvents = await getEventsByOrganizerId(organizer._id);

    return (
        <main className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Events</h1>
                <Link
                    href="/create-event"
                    className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-2 rounded-lg"
                >
                    + Create Event
                </Link>
            </div>

            {safeEvents.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-400 mb-6">You haven't created any events yet</p>
                    <Link
                        href="/create-event"
                        className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-2 rounded-lg inline-block"
                    >
                        Create Your First Event
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {safeEvents.map((event: any) => (
                        <div
                            key={event._id}
                            className="glass rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                        >
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {event.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {event.time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {event.location}
                                    </span>
                                    <span className="flex items-center gap-1 text-primary">
                                        <IndianRupee className="h-4 w-4" />
                                        {event.price}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-wrap md:flex-nowrap">
                                <Link
                                    href={`/events/${event.slug}`}
                                    className="bg-dark-200 hover:bg-dark-300 text-white px-4 py-2 rounded text-sm"
                                >
                                    View
                                </Link>
                                <Link
                                    href={`/organizer/events/${event._id}/edit`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                                >
                                    Edit
                                </Link>
                                <DeleteEventButton eventId={event._id} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
