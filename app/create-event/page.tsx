import CreateEventForm from "@/components/forms/CreateEventForm";

export default function CreateEventPage() {
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
