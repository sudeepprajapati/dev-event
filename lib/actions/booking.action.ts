'use server';

import { Booking } from "@/database";
import connectDB from "../mongodb";

export const createBooking = async ({ eventId, email }:
    { eventId: string; slug: string; email: string }) => {
    try {
        await connectDB();

        await Booking.create({ eventId, email })

        return { success: true }
    } catch (e) {
        console.error('create booking failed', e)
        return { success: false };
    }
}

export const getBookingById = async (id: string) => {
    try {
        await connectDB();
        const booking = await Booking.findById(id).populate('eventId').lean();

        if (!booking) return null;

        return {
            ...booking,
            _id: booking._id.toString(),
            eventId: booking.eventId && typeof booking.eventId === 'object' ? {
                ...booking.eventId,
                _id: booking.eventId._id?.toString?.() ?? booking.eventId._id,
            } : booking.eventId,
        };
    } catch {
        return null;
    }
}

export const getBookingsByEmail = async (email: string) => {
    try {
        await connectDB();
        const bookings = await Booking.find({ email })
            .populate("eventId")
            .sort({ createdAt: -1 })
            .lean();

        return bookings.map((booking: any) => ({
            ...booking,
            _id: booking._id.toString(),
            eventId: booking.eventId && typeof booking.eventId === 'object' ? {
                ...booking.eventId,
                _id: booking.eventId._id?.toString?.() ?? booking.eventId._id,
            } : booking.eventId,
        }));
    } catch {
        return [];
    }
}

export const getUserBookingForEvent = async (eventId: string, email?: string) => {
    if (!email) return null;

    try {
        await connectDB();
        const booking = await Booking.findOne({ eventId, email })
            .populate('eventId')
            .lean();

        if (!booking) return null;

        return {
            ...booking,
            _id: booking._id.toString(),
            eventId: booking.eventId && typeof booking.eventId === 'object' ? {
                ...booking.eventId,
                _id: booking.eventId._id?.toString?.() ?? booking.eventId._id,
            } : booking.eventId,
        };
    } catch {
        return null;
    }
}