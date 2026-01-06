import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Event, Booking } from '@/database';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/lib/auth/authOptions';
import { checkRateLimit, createRateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const rateLimitResult = await checkRateLimit(
            req,
            RATE_LIMIT_PRESETS.PAYMENT
        );

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult);
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { eventId, email } = await req.json();

        if (!eventId || !email) {
            return NextResponse.json(
                { success: false, message: 'Missing eventId or email' },
                { status: 400 }
            );
        }

        if (email !== session.user.email) {
            return NextResponse.json(
                { success: false, message: 'Email mismatch' },
                { status: 403 }
            );
        }

        await connectDB();

        const event = await Event.findById(eventId).lean();
        if (!event) {
            return NextResponse.json(
                { success: false, message: 'Event not found' },
                { status: 404 }
            );
        }

        if (event.price > 0) {
            return NextResponse.json(
                { success: false, message: 'This is a paid event. Use payment flow instead.' },
                { status: 400 }
            );
        }

        const existing = await Booking.findOne({
            eventId,
            email,
            paymentStatus: 'paid',
        });

        if (existing) {
            return NextResponse.json(
                { success: false, message: 'You have already booked this free event' },
                { status: 409 }
            );
        }

        const booking = await Booking.create({
            eventId,
            email,
            amount: 0,
            paymentStatus: 'paid',
        });

        return NextResponse.json({
            success: true,
            message: 'Free event booked successfully',
            bookingId: booking._id,
        });
    } catch (error) {
        console.error('Free event booking error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to book free event' },
            { status: 500 }
        );
    }
}
