import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Event, User, Booking } from '@/database';
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

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        const safeUsers = users.map((user: Record<string, unknown>) => ({
            ...user,
            _id: (user._id as any).toString(),
            eventCount: 0,
        }));

        const eventCounts = await Event.find().select('organizerId').lean();
        const userEventMap = new Map();

        eventCounts.forEach((e: Record<string, unknown>) => {
            const organizerId = (e.organizerId as any)?.toString();
            if (organizerId) {
                const count = userEventMap.get(organizerId) || 0;
                userEventMap.set(organizerId, count + 1);
            }
        });

        const usersWithEventCount = safeUsers.map((user: Record<string, unknown>) => ({
            ...user,
            eventCount: userEventMap.get(user._id as string) || 0,
        }));

        return NextResponse.json({
            success: true,
            users: usersWithEventCount,
            stats: {
                totalUsers: safeUsers.length,
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch users' }, { status: 500 });
    }
}
