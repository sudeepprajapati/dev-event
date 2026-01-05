import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import Link from 'next/link';
import Image from 'next/image';
import VerifyPaymentButton from '@/components/VerifyPaymentButton';
import { getBookingById } from '@/lib/actions/booking.action';
import { Clock, XCircle, CheckCircle, Mail, Calendar, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';

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
            <main className="max-w-4xl mx-auto py-12 px-4">
                <div className="glass rounded-xl p-8 text-center border-l-4 border-l-red-500">
                    <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                    <h1 className="text-3xl font-bold mb-2">Booking Not Found</h1>
                    <p className="text-gray-400">The booking you are looking for does not exist.</p>
                    <Link href="/my-bookings" className="inline-flex items-center gap-2 mt-4 text-primary hover:underline">
                        View My Bookings
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </main>
        );
    }

    if (safeBooking.email !== session.user.email) {
        redirect('/');
    }

    const event = safeBooking.eventId as any;
    const paymentStatus = safeBooking.paymentStatus || 'pending';

    if (paymentStatus === 'pending') {
        return (
            <main className="max-w-4xl mx-auto py-12 px-4">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="h-14 w-14 text-yellow-500" />
                        <h1 className="text-5xl font-bold">Processing Payment</h1>
                    </div>
                    <p className="text-gray-400 text-lg">Please wait while we confirm your payment...</p>
                </div>

                <div className="glass rounded-xl p-8 mb-8 border-l-4 border-l-yellow-500">
                    <p className="text-gray-300 mb-4">
                        Your payment is being processed. This page will update automatically.
                    </p>
                    <p className="text-sm text-gray-400">
                        If you don't see confirmation in a few seconds, please refresh the page or click the button below.
                    </p>
                </div>

                <div className="flex gap-4">
                    <Link
                        href="/my-bookings"
                        className="flex-1 bg-dark-200 hover:bg-dark-300 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all border border-border-dark"
                    >
                        <Calendar className="h-5 w-5" />
                        View My Bookings
                    </Link>
                    <VerifyPaymentButton bookingId={safeBooking._id} />
                </div>
            </main>
        );
    }

    if (paymentStatus === 'failed') {
        return (
            <main className="max-w-4xl mx-auto py-12 px-4">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <XCircle className="h-14 w-14 text-red-500" />
                        <h1 className="text-5xl font-bold">Payment Failed</h1>
                    </div>
                    <p className="text-gray-400 text-lg">Your payment could not be processed</p>
                </div>

                <div className="glass rounded-xl p-8 mb-8 border-l-4 border-l-red-500">
                    <p className="text-gray-300 mb-4">
                        The payment was unsuccessful. Please try again or contact support if the problem persists.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <Link
                        href={`/events/${event.slug}`}
                        className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                        Try Again
                        <ChevronRight className="h-5 w-5" />
                    </Link>
                    <Link
                        href="/"
                        className="w-full bg-dark-200 hover:bg-dark-300 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 border border-border-dark transition-all"
                    >
                        Browse More Events
                        <ChevronRight className="h-5 w-5" />
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-4xl mx-auto py-12 px-4">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-14 w-14 text-green-500" />
                    <h1 className="text-5xl font-bold">Booking Confirmed!</h1>
                </div>
                <p className="text-gray-400 text-lg">Your payment has been successfully processed</p>
            </div>

            <div className="glass rounded-xl p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    Booking Details
                </h2>

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
                            <p className="text-sm text-gray-400 mb-1">Event Title</p>
                            <p className="text-xl font-semibold">{event.title}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Date
                                </p>
                                <p className="font-medium">{event.date}</p>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Time
                                </p>
                                <p className="font-medium">{event.time}</p>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Location
                                </p>
                                <p className="font-medium">{event.location}</p>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-sm text-gray-400 mb-1">Mode</p>
                                <p className="font-medium capitalize">{event.mode}</p>
                            </div>
                        </div>

                        <div className="border-t border-border-dark pt-4">
                            <p className="text-sm text-gray-400 mb-1">Attendee Email</p>
                            <p className="font-medium">{safeBooking.email}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border-dark pt-6">
                    <h3 className="font-semibold mb-4">Payment Information</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2">
                            <span className="text-gray-400">Booking ID</span>
                            <span className="font-mono text-sm bg-dark-200 px-2 py-1 rounded">{safeBooking._id}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-400">Amount Paid</span>
                            <span className="font-bold text-xl text-primary">₹{safeBooking.amount}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-400">Payment Status</span>
                            <span className="px-3 py-1 rounded-full bg-green-900/30 text-green-400 font-semibold text-sm">Paid</span>
                        </div>
                        {safeBooking.razorpayPaymentId && (
                            <div className="flex justify-between py-2">
                                <span className="text-gray-400">Payment ID</span>
                                <span className="font-mono text-xs bg-dark-200 px-2 py-1 rounded">{safeBooking.razorpayPaymentId.slice(0, 20)}...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass rounded-xl p-6 mb-8 border-l-4 border-l-green-500">
                <Mail className="h-6 w-6 text-green-500 mb-2" />
                <div>
                    <p className="font-semibold mb-1">Confirmation Email Sent</p>
                    <p className="text-sm text-gray-400">
                        A detailed confirmation email has been sent to <span className="font-mono">{safeBooking.email}</span>. Please check your inbox.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/my-bookings"
                    className="bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                    <Calendar className="h-5 w-5" />
                    View Bookings
                </Link>
                <Link
                    href={`/events/${event.slug}`}
                    className="bg-dark-200 hover:bg-dark-300 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 border border-border-dark transition-all"
                >
                    Back to Event
                    <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                    href="/"
                    className="bg-dark-200 hover:bg-dark-300 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 border border-border-dark transition-all"
                >
                    Browse Events
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
        </main>
    );
}
