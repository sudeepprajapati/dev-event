'use client'

import { useState } from "react"

const BookEvent = () => {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTimeout(() => {
            setSubmitted(true)
        }, 1000);
    }

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