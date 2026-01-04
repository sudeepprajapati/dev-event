import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import Link from 'next/link';
import Image from 'next/image';
import VerifyPaymentButton from '@/components/VerifyPaymentButton';
import { getBookingById } from '@/lib/actions/booking.action';
import { Clock, XCircle, CheckCircle, Mail } from 'lucide-react';

export const metadata = {
    title: 'Booking Success',
};

export const dynamic = 'force-dynamic';

export default async function BookingSuccessPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect('/auth/signin');

    const safeBooking = await getBookingById(slug);

    if (!safeBooking) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="text-center text-red-600">Booking not found</div>
            </div>
        );
    }

    if (safeBooking.email !== session.user.email) {
        redirect('/');
    }

    const event = safeBooking.eventId as any;
    const paymentStatus = safeBooking.paymentStatus || 'pending';

    if (paymentStatus === 'pending') {
        return (
            <main className="max-w-2xl mx-auto py-12 px-4">
                <div className="text-center mb-8">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-yellow-600" />
                    <h1 className="text-3xl font-bold text-yellow-600 mb-2">Processing Payment</h1>
                    <p className="text-gray-400">Please wait while we confirm your payment...</p>
                </div>

                <div className="glass rounded-lg p-8 mb-8 text-center">
                    <p className="text-gray-300 mb-4">
                        Your payment is being processed. This page will update automatically.
                    </p>
                    <p className="text-sm text-gray-400">
                        If you don't see confirmation in a few seconds, please refresh the page.
                    </p>
                </div>

                <div className="flex gap-4">
                    <Link
                        href="/my-bookings"
                        className="flex-1 bg-dark-200 hover:bg-dark-300 text-white font-semibold py-3 rounded-lg text-center border border-border-dark"
                    >
                        View My Bookings
                    </Link>
                    <VerifyPaymentButton bookingId={safeBooking._id} />
                </div>
            </main>
        );
    }

    if (paymentStatus === 'failed') {
        return (
            <main className="max-w-2xl mx-auto py-12 px-4">
                <div className="text-center mb-8">
                    <XCircle className="h-16 w-16 mx-auto mb-4 text-red-600" />
                    <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h1>
                    <p className="text-gray-400">Your payment could not be processed</p>
                </div>

                <div className="glass rounded-lg p-8 mb-8">
                    <p className="text-gray-300 mb-4">
                        The payment was unsuccessful. Please try again or contact support if the problem persists.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <Link
                        href={`/events/${event.slug}`}
                        className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg text-center"
                    >
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="w-full bg-dark-200 hover:bg-dark-300 text-white font-semibold py-3 rounded-lg text-center border border-border-dark"
                    >
                        Browse More Events
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-2xl mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h1 className="text-3xl font-bold text-green-600 mb-2">Booking Confirmed!</h1>
                <p className="text-gray-400">Your payment has been successfully processed</p>
            </div>

            <div className="glass rounded-lg p-8 mb-8">
                <h2 className="text-xl font-bold mb-6">Booking Details</h2>

                <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="md:w-2/5">
                        <Image
                            src={event.image}
                            alt={event.title}
                            width={300}
                            height={250}
                            className="rounded-lg w-full"
                        />
                    </div>

                    <div className="md:w-3/5 space-y-4">
                        <div>
                            <p className="text-sm text-gray-400">Event Title</p>
                            <p className="text-lg font-semibold">{event.title}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Date</p>
                                <p className="font-medium">{event.date}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Time</p>
                                <p className="font-medium">{event.time}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Location</p>
                                <p className="font-medium">{event.location}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Mode</p>
                                <p className="font-medium capitalize">{event.mode}</p>
                            </div>
                        </div>

                        <div className="border-t border-border-dark pt-4">
                            <p className="text-sm text-gray-400">Attendee Email</p>
                            <p className="font-medium">{safeBooking.email}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border-dark pt-6">
                    <h3 className="font-semibold mb-4">Payment Information</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Booking ID</span>
                            <span className="font-mono text-sm">{safeBooking._id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Amount Paid</span>
                            <span className="font-semibold">₹{safeBooking.amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Payment Status</span>
                            <span className="text-green-600 font-semibold">Paid</span>
                        </div>
                        {safeBooking.razorpayPaymentId && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Payment ID</span>
                                <span className="font-mono text-xs">{safeBooking.razorpayPaymentId.slice(0, 20)}...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-8 flex items-start gap-3">
                <Mail className="h-5 w-5 text-green-200 shrink-0" />
                <p className="text-sm text-green-200">
                    A confirmation email has been sent to {safeBooking.email}
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <Link
                    href="/my-bookings"
                    className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg text-center"
                >
                    View All My Bookings
                </Link>
                <Link
                    href={`/events/${event.slug}`}
                    className="w-full bg-dark-200 hover:bg-dark-300 text-white font-semibold py-3 rounded-lg text-center border border-border-dark"
                >
                    Back to Event
                </Link>
                <Link
                    href="/"
                    className="w-full bg-dark-200 hover:bg-dark-300 text-white font-semibold py-3 rounded-lg text-center border border-border-dark"
                >
                    Browse More Events
                </Link>
            </div>
        </main>
    );
}
