import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Event, Booking } from '@/database';
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

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        if (user.email === process.env.ADMIN_EMAIL) {
            return NextResponse.json({ success: false, message: 'Cannot delete admin user' }, { status: 403 });
        }

        await Event.deleteMany({ organizerId: id });
        await Booking.deleteMany({ userId: id });
        await User.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'User and all associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete user' }, { status: 500 });
    }
}
