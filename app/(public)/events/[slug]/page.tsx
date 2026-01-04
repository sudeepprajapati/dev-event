import { getEventBySlug, getSimilarEventsBySlug } from "@/lib/actions/event.action";
import { notFound } from "next/navigation";
import EventDetails from "@/components/EventDetails";

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const event = await getEventBySlug(slug);

    if (!event) {
        notFound();
    }

    const similarEvents = await getSimilarEventsBySlug(slug);

    return (
        <main>
            <EventDetails event={event} similarEvents={similarEvents} />
        </main>
    )
}
