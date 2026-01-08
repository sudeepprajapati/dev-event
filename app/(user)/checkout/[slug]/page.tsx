'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, AlertTriangle, ChevronRight } from 'lucide-react';

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
                toast.error(data.message || 'Failed to book event');
                setBooking(false);
                return;
            }

            toast.success('Booking confirmed!');
            router.push(`/booking-success/${data.bookingId}`);
        } catch {
            toast.error('An error occurred. Please try again.');
            setBooking(false);
        }
    };

    if (status === 'loading' || loading) {
        return <div className="max-w-2xl mx-auto py-8 px-4">Loading...</div>;
    }

    if (!event || !session?.user?.email) return null;

    const isFree = event.price === 0;

    return (
        <main className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-5xl font-bold mb-2">
                {isFree ? 'Register for Free Event' : 'Confirm Booking'}
            </h1>
            <p className="text-gray-400 text-lg mb-8">
                {isFree ? 'Complete your registration for this event' : 'Review your booking details before payment'}
            </p>

            <div className="glass rounded-xl p-8 mb-8">
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="md:w-2/5">
                        <Image
                            src={event.image}
                            alt={event.title}
                            width={300}
                            height={250}
                            className="rounded-lg w-full object-cover"
                        />
                    </div>

                    <div className="md:w-3/5 space-y-5">
                        <div>
                            <h2 className="text-2xl font-bold mb-4">{event.title}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Info label="Date" value={event.date} icon={Calendar} />
                            <Info label="Time" value={event.time} icon={Clock} />
                            <Info label="Location" value={event.location} icon={MapPin} />
                            <Info label="Mode" value={event.mode} />
                        </div>

                        <div className="border-t border-border-dark pt-4">
                            <p className="text-sm text-gray-400 mb-1">Your Email</p>
                            <p className="font-medium">{session.user.email}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border-dark pt-6">
                    <PriceBox price={event.price} />
                </div>
            </div>

            <Warning isFree={isFree} />

            {isFree ? (
                <button
                    onClick={handleFreeBooking}
                    disabled={booking}
                    className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                    {booking ? 'Registering...' : (
                        <>
                            Register Now - Free
                            <ChevronRight className="h-5 w-5" />
                        </>
                    )}
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

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
    return (
        <div className="flex flex-col">
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {label}
            </p>
            <p className="font-medium">{value}</p>
        </div>
    );
}

function PriceBox({ price }: { price: number }) {
    if (price === 0) {
        return (
            <div className="bg-dark-100 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">Price per ticket</span>
                    <span className="text-3xl font-bold text-green-500">FREE</span>
                </div>
                <div className="flex justify-between items-center border-t pt-4 mt-4">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-4xl font-bold text-green-500">₹0</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-dark-100 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Price per ticket</span>
                <span className="text-3xl font-bold text-primary">₹{price}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-4 mt-4">
                <span className="font-semibold">Total Amount</span>
                <span className="text-4xl font-bold text-primary">₹{price}</span>
            </div>
        </div>
    );
}

function Warning({ isFree }: { isFree: boolean }) {
    if (isFree) {
        return (
            <div className="glass rounded-xl p-6 mb-8 border-l-4 border-l-green-500">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Free Event Registration</p>
                        <p className="text-sm text-gray-300">
                            This is a free event. Click &quot;Register Now&quot; to confirm your attendance.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-6 mb-8 border-l-4 border-l-yellow-500">
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold mb-1">Payment Information</p>
                    <p className="text-sm text-gray-300">
                        You will be redirected to Razorpay for secure payment.
                        Do not refresh or close this page during the payment process.
                    </p>
                </div>
            </div>
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
                            toast.error(`Payment verification failed: ${verifyData.message}`);
                            btn.disabled = false;
                            btn.textContent = 'Proceed to Payment';
                        }
                    } catch (error) {
                        console.error('Verification error:', error);
                        toast.error('Payment completed but verification failed. Please contact support.');
                        window.location.href = `/booking-success/${data.data.bookingId}`;
                    }
                },
            });

            rzp.open();
        } catch {
            btn.disabled = false;
            btn.textContent = 'Proceed to Payment';
            toast.error('Payment failed');
        }
    };

    return (
        <>
            <button
                onClick={(e) => handlePayment(e.currentTarget)}
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
                Proceed to Payment
                <ChevronRight className="h-5 w-5" />
            </button>

            <script src="https://checkout.razorpay.com/v1/checkout.js" async />
        </>
    );
}
