'use client'

import { createBooking } from "@/lib/actions/booking.action"
import { useState } from "react"

const BookEvent = ({ eventId, slug }: { eventId: string; slug: string }) => {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) return;

        try {
            const { success } = await createBooking({ eventId, slug, email });

            if (success) {
                setSubmitted(true);
                setEmail('');
            }
        } catch (error) {
            console.error('Booking creation failed')
        }
    };

    return (
        <div id="book-event">
            {submitted ? (
                <p className="text-sm">Thank you for signing up!</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="">
                        <label htmlFor="email">Email Address</label>
                        <input type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email addresss"
                        />
                    </div>
                    <button type="submit" className="btn-submit">Submit</button>
                </form>
            )}
        </div>
    )
}

export default BookEvent