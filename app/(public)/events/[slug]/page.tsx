import { getEventBySlug, getSimilarEventsBySlug } from "@/lib/actions/event.action";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import EventDetails from "@/components/EventDetails";
import { authOptions } from "@/lib/auth/authOptions";
import { getUserBookingForEvent } from "@/lib/actions/booking.action";

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    const event = await getEventBySlug(slug);

    if (!event) {
        notFound();
    }

    const similarEvents = await getSimilarEventsBySlug(slug);
    const userBooking = await getUserBookingForEvent(event._id, session?.user?.email);

    return (
        <main>
            <EventDetails event={event} similarEvents={similarEvents} userBooking={userBooking} />
        </main>
    )
}
