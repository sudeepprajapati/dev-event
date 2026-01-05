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
        const formData = await req.formData();

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

        // Convert FormData to object
        let updates;
        try {
            updates = Object.fromEntries(formData);
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid data format' }, { status: 400 });
        }

        // Handle image update if provided
        const file = formData.get('image') as File;
        if (file && file.size > 0) {
            // Upload new image using Cloudinary
            const { v2 as cloudinary } = await import('cloudinary');
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                }).end(buffer);
            });

            updates.image = (uploadResult as { secure_url: string }).secure_url;
        }

        // Prevent organizerId and slug changes
        delete updates.organizerId;
        delete updates.slug;

        // Parse JSON fields
        const tags = JSON.parse(formData.get('tags') as string);
        const agenda = JSON.parse(formData.get('agenda') as string);

        const updated = await Event.findByIdAndUpdate(slug, {
            ...updates,
            tags,
            agenda
        }, { new: true });

        return NextResponse.json({ success: true, message: 'Event updated', data: updated });
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}
