'use client';

import { createBooking } from "@/lib/actions/booking.action"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { CheckCircle, LogIn } from "lucide-react"

const BookEvent = ({ eventId, slug }: { eventId: string; slug: string }) => {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { data: session } = useSession()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.email) {
            router.push('/auth/signin');
            return;
        }

        if (!email) return;

        try {
            const { success } = await createBooking({ eventId, slug, email });

            if (success) {
                setSubmitted(true);
                setEmail('');
                setError(null);
            } else {
                setError('Booking failed. Please try again.');
            }
        } catch (error) {
            console.error('Booking creation failed', error)
            setError('An error occurred. Please try again.')
        }
    };

    if (!session?.user?.email) {
        return (
            <div id="book-event">
                <button
                    onClick={() => router.push('/auth/signin')}
                    className="btn-submit w-full flex items-center justify-center gap-2"
                >
                    <LogIn className="h-5 w-5" />
                    Sign In to Book
                </button>
            </div>
        )
    }

    return (
        <div id="book-event">
            {submitted ? (
                <div className="text-green-600 text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Registration confirmed! You can view your booking in My Bookings.
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="">
                        <label htmlFor="email">Email Address</label>
                        <input type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                        />
                    </div>
                    {error && (
                        <div className="text-red-600 text-sm py-2">{error}</div>
                    )}
                    <button type="submit" className="btn-submit">Book Now</button>
                </form>
            )}
        </div>
    )
}

export default BookEvent
