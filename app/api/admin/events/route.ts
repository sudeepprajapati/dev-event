import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Event, Booking } from '@/database';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const events = await Event.find()
            .populate('organizerId', 'email name')
            .sort({ createdAt: -1 })
            .lean();

        const safeEvents = events.map((event: Record<string, unknown>) => ({
            ...event,
            _id: (event._id as any).toString(),
            organizerId: (event.organizerId as Record<string, unknown>)?._id?.toString(),
            organizerEmail: (event.organizerId as Record<string, unknown>)?.email,
            organizerName: (event.organizerId as Record<string, unknown>)?.name,
        }));

        const allBookings = await Booking.find().lean();
        const bookingStats = new Map();

        allBookings.forEach((b: Record<string, unknown>) => {
            const eventId = (b.eventId as any)?.toString();
            if (eventId) {
                const stats = bookingStats.get(eventId) || { totalBookings: 0, paidBookings: 0 };
                stats.totalBookings++;
                if ((b.paymentStatus as string) === 'paid') {
                    stats.paidBookings++;
                }
                bookingStats.set(eventId, stats);
            }
        });

        const eventsWithStats = safeEvents.map((event: Record<string, unknown>) => ({
            ...event,
            stats: bookingStats.get(event._id as string) || { totalBookings: 0, paidBookings: 0 },
        }));

        const totalRevenue = safeEvents.reduce((sum: number, e: Record<string, unknown>) => sum + ((e.price as number) || 0), 0);

        return NextResponse.json({
            success: true,
            events: eventsWithStats,
            stats: {
                totalEvents: safeEvents.length,
                totalRevenue,
            },
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch events' }, { status: 500 });
    }
}
