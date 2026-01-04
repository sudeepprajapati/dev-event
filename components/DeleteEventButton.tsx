"use client";

import { useState } from "react";

interface DeleteEventButtonProps {
    eventId: string;
}

export default function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure? This cannot be undone.")) {
            return;
        }

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/organizer/events/${eventId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                window.location.reload();
            } else {
                alert("Failed to delete event");
            }
        } catch (error) {
            alert("An error occurred while deleting the event");
        } finally {
            setIsDeleting(false);
        }
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
