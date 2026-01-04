"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const BookEventPaid = ({ eventId, slug, price }: { eventId: string; slug: string; price: number }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { data: session } = useSession();

    const handleBookingClick = (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.email) {
            router.push('/auth/signin');
            return;
        }

        setLoading(true);
        router.push(`/checkout/${slug}`); // ✅ FIX
    };


    if (!session?.user?.email) {
        return (
            <div id="book-event">
                <button
                    onClick={() => router.push('/auth/signin')}
                    className="btn-submit w-full"
                >
                    Sign In to Book
                </button>
            </div>
        );
    }

    return (
        <div id="book-event">
            <form onSubmit={handleBookingClick}>
                <div className="font-medium py-2">Price: ₹{price}</div>
                {error && <div className="text-red-600 text-sm py-1">{error}</div>}
                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? "Redirecting..." : "Book Now"}
                </button>
            </form>
        </div>
    );
};

export default BookEventPaid;
