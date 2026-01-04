import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import CreateEventForm from '@/components/forms/CreateEventForm';
import { Metadata } from 'next';
import { getUserByEmail } from '@/lib/actions/auth.action';
import { getEventById } from '@/lib/actions/event.action';

export const metadata: Metadata = {
    title: 'Edit Event',
};

export const dynamic = 'force-dynamic';

export default async function EditEventPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect('/auth/signin');

    const organizer = await getUserByEmail(session.user.email);
    if (!organizer) redirect('/auth/signin');

    const safeEvent = await getEventById(slug);
    if (!safeEvent) {
        return <div className="max-w-3xl mx-auto py-8 px-4">Event not found</div>;
    }

    if (safeEvent.organizerId !== organizer._id.toString()) {
        redirect('/');
    }

    return (
        <main>
            <section className="max-w-3xl w-full mx-auto">
                <h1>Edit Event</h1>
                <p className="subheading">Update your event details</p>

                <div className="mt-10 glass p-8 rounded-xl">
                    <CreateEventForm initialEvent={safeEvent} mode="edit" />
                </div>
            </section>
        </main>
    );
}
