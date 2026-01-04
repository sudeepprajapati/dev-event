import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Event, User, Booking } from '@/database';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/lib/auth/authOptions';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await params;
        await connectDB();

        const organizer = await User.findOne({ email: session.user.email });
        if (!organizer) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const event = await Event.findById(slug);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
        }

        // Check ownership
        if (event.organizerId.toString() !== organizer._id.toString()) {
            return NextResponse.json({ success: false, message: 'Not authorized to delete this event' }, { status: 403 });
        }

        // Delete event and associated bookings
        await Booking.deleteMany({ eventId: slug });
        await Event.findByIdAndDelete(slug);

        return NextResponse.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await params;
        const updates = await req.json();

        await connectDB();

        const organizer = await User.findOne({ email: session.user.email });
        if (!organizer) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const event = await Event.findById(slug);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
        }

        // Check ownership
        if (event.organizerId.toString() !== organizer._id.toString()) {
            return NextResponse.json({ success: false, message: 'Not authorized to edit this event' }, { status: 403 });
        }

        // Prevent organizerId and slug changes
        delete updates.organizerId;
        delete updates.slug;

        const updated = await Event.findByIdAndUpdate(slug, updates, { new: true });

        return NextResponse.json({ success: true, message: 'Event updated', data: updated });
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}
