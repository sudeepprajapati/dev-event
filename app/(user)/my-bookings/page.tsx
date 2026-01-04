import { getServerSession } from "next-auth";
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import { getBookingsByEmail } from '@/lib/actions/booking.action';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "My Bookings",
};

export const dynamic = 'force-dynamic';

export default async function MyBookingsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect('/auth/signin');

    const safeBookings = await getBookingsByEmail(session.user.email);

    return (
        <main className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
            <div className="space-y-4">
                {safeBookings.length === 0 && <div>No bookings found.</div>}
                {safeBookings.map((booking: any) => (
                    <div key={booking._id} className="rounded p-4 bg-black/50">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                                <div className="font-semibold text-lg">{booking.eventId?.title}</div>
                                <div className="text-sm text-gray-500">{booking.eventId?.date}</div>
                                <div className="text-xs text-gray-400">Booking ID: {booking._id}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">Status: <span className={
                                    booking.paymentStatus === 'paid' ? 'text-green-600' : booking.paymentStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                                }>{booking.paymentStatus}</span></div>
                                <div className="text-sm">Amount: ₹{booking.amount}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
