import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Razorpay from 'razorpay';

import { Event, Booking } from '@/database';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/lib/auth/authOptions';

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

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

        const event = await Event.findById(eventId);
        if (!event || typeof event.price !== 'number' || event.price <= 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid event or price' },
                { status: 400 }
            );
        }

        // Prevent double paid booking
        const existing = await Booking.findOne({
            eventId,
            email,
            paymentStatus: 'paid',
        });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'Already booked' },
                { status: 409 }
            );
        }

        // Razorpay init (FIXED)
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!, // ✅ FIX
        });

        const order = await razorpay.orders.create({
            amount: event.price * 100, // paise
            currency: 'INR',
            receipt: `evt_${eventId.slice(-6)}_${Date.now().toString().slice(-6)}`,
            payment_capture: true,
        });

        const booking = await Booking.create({
            eventId,
            email,
            amount: event.price,
            paymentStatus: 'pending',
            razorpayOrderId: order.id,
        });

        return NextResponse.json({
            success: true,
            data: {
                key: process.env.RAZORPAY_KEY_ID,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                bookingId: booking._id,
            },
        });
    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json(
            { success: false, message: 'Order creation failed' },
            { status: 500 }
        );
    }
}
