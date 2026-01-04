"use client";

import { useState } from "react";
import { toast } from "sonner";

interface DeleteEventButtonProps {
    eventId: string;
}

export default function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        toast("Are you sure?", {
            description: "This action cannot be undone.",
            action: {
                label: "Delete",
                onClick: async () => {
                    setIsDeleting(true);

                    try {
                        const response = await fetch(`/api/organizer/events/${eventId}`, {
                            method: "DELETE",
                        });

                        if (response.ok) {
                            toast.success("Event deleted successfully");
                            window.location.reload();
                        } else {
                            toast.error("Failed to delete event");
                        }
                    } catch (error) {
                        toast.error("An error occurred while deleting the event");
                    } finally {
                        setIsDeleting(false);
                    }
                },
            },
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm"
        >
            {isDeleting ? "Deleting..." : "Delete"}
        </button>
    );
}
