'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type EventType = {
    _id: string;
    title: string;
    image: string;
    date: string;
    time: string;
    location: string;
    mode: string;
    price: number;
};

export default function CheckoutPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);

    const { data: session, status } = useSession();
    const router = useRouter();

    const [event, setEvent] = useState<EventType | null>(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        if (!slug) return;

        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${slug}`);
                const data = await res.json();

                if (!res.ok || !data?.event) {
                    router.replace('/404');
                    return;
                }

                setEvent(data.event);
            } catch {
                router.replace('/404');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [slug, router]);

    const handleFreeBooking = async () => {
        if (!event || !session?.user?.email) return;

        setBooking(true);
        try {
            const res = await fetch('/api/bookings/free', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: event._id,
                    email: session.user.email,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'Failed to book event');
                setBooking(false);
                return;
            }

            router.push(`/booking-success/${data.bookingId}`);
        } catch {
            alert('An error occurred. Please try again.');
            setBooking(false);
        }
    };

    if (status === 'loading' || loading) {
        return <div className="max-w-2xl mx-auto py-8 px-4">Loading...</div>;
    }

    if (!event || !session?.user?.email) return null;

    const isFree = event.price === 0;

    return (
        <main className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">
                {isFree ? 'Register for Free Event' : 'Confirm Booking'}
            </h1>

            <div className="glass rounded-lg p-6 mb-8">
                <Image
                    src={event.image}
                    alt={event.title}
                    width={400}
                    height={250}
                    className="rounded-lg mb-4 w-full"
                />

                <h2 className="text-2xl font-semibold mb-2">{event.title}</h2>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <Info label="Date" value={event.date} />
                    <Info label="Time" value={event.time} />
                    <Info label="Location" value={event.location} />
                    <Info label="Mode" value={event.mode} />
                </div>

                <div className="border-t mt-4 pt-4">
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-medium">{session.user.email}</p>
                </div>
            </div>

            <PriceBox price={event.price} />

            <Warning isFree={isFree} />

            {isFree ? (
                <button
                    onClick={handleFreeBooking}
                    disabled={booking}
                    className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg disabled:opacity-50"
                >
                    {booking ? 'Registering...' : 'Register Now - Free'}
                </button>
            ) : (
                <CheckoutButton
                    eventId={event._id}
                    email={session.user.email}
                />
            )}
        </main>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}

function PriceBox({ price }: { price: number }) {
    if (price === 0) {
        return (
            <div className="bg-dark-100 rounded-lg p-6 mb-8">
                <div className="flex justify-between">
                    <span>Price per ticket</span>
                    <span className="text-2xl font-bold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between border-t pt-4 mt-4">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-3xl font-bold text-green-600">₹0</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-dark-100 rounded-lg p-6 mb-8">
            <div className="flex justify-between mb-4">
                <span>Price per ticket</span>
                <span className="text-2xl font-bold text-primary">₹{price}</span>
            </div>
            <div className="flex justify-between border-t pt-4">
                <span className="font-semibold">Total Amount</span>
                <span className="text-3xl font-bold text-primary">₹{price}</span>
            </div>
        </div>
    );
}

function Warning({ isFree }: { isFree: boolean }) {
    if (isFree) {
        return (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-8">
                <p className="text-sm text-green-200">
                    This is a free event. Click &quot;Register Now&quot; to confirm your attendance.
                    You will receive a confirmation email with event details.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-200">
                You will be redirected to Razorpay for secure payment.
                Do not refresh or close this page.
            </p>
        </div>
    );
}

function CheckoutButton({ eventId, email }: { eventId: string; email: string }) {
    const handlePayment = async (btn: HTMLButtonElement) => {
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            const res = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, email }),
            });

            const data = await res.json();
            if (!data.success) throw new Error();

            const Razorpay = (window as unknown as { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
            if (!Razorpay) throw new Error('Razorpay SDK not loaded');

            const rzp = new Razorpay({
                ...data.data,
                handler: async (response: Record<string, string>) => {
                    try {
                        const verifyRes = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                bookingId: data.data.bookingId,
                                ...response,
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            window.location.href = `/booking-success/${data.data.bookingId}`;
                        } else {
                            alert(`Payment verification failed: ${verifyData.message}`);
                            btn.disabled = false;
                            btn.textContent = 'Proceed to Payment';
                        }
                    } catch (error) {
                        console.error('Verification error:', error);
                        alert('Payment completed but verification failed. Please contact support.');
                        window.location.href = `/booking-success/${data.data.bookingId}`;
                    }
                },
            });

            rzp.open();
        } catch {
            btn.disabled = false;
            btn.textContent = 'Proceed to Payment';
            alert('Payment failed');
        }
    };

    return (
        <>
            <button
                onClick={(e) => handlePayment(e.currentTarget)}
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg"
            >
                Proceed to Payment
            </button>

            <script src="https://checkout.razorpay.com/v1/checkout.js" async />
        </>
    );
}
