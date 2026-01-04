import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import CreateEventForm from "@/components/forms/CreateEventForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Event",
};

export const dynamic = 'force-dynamic';

export default async function CreateEventPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/auth/signin");

    return (
        <section className="max-w-3xl w-full mx-auto">
            <h1>Create Event</h1>
            <p className="subheading">
                Publish a new developer event
            </p>

            <div className="mt-10 glass p-8 rounded-xl">
                <CreateEventForm />
            </div>
        </section>
    );
}
