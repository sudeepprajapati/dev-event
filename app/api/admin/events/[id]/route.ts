import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Event, User, Booking } from '@/database';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/lib/auth/authOptions';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        await connectDB();

        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
        }

        await Booking.deleteMany({ eventId: id });
        await Event.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'Event and all associated bookings deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete event' }, { status: 500 });
    }
}
