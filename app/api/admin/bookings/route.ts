import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Booking, Event } from "@/database";
import connectDB from "@/lib/mongodb";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.email !== process.env.ADMIN_EMAIL) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const event = searchParams.get("event");

    const filter = event ? { eventId: event } : {};

    const bookings = await Booking.find(filter)
        .populate("eventId")
        .sort({ createdAt: -1 })
        .lean();

    const safeBookings = bookings.map((b: any) => ({
        ...b,
        _id: b._id.toString(),
        eventId: b.eventId
            ? {
                ...b.eventId,
                _id: b.eventId._id.toString(),
            }
            : null,
    }));

    const events = await Event.find().sort({ date: -1 }).lean();
    const safeEvents = events.map((e: any) => ({
        ...e,
        _id: e._id.toString(),
    }));

    const totalBookings = safeBookings.length;
    const paidBookings = safeBookings.filter(b => b.paymentStatus === "paid").length;
    const pendingBookings = safeBookings.filter(b => b.paymentStatus === "pending").length;
    const totalRevenue = safeBookings.reduce(
        (sum, b) => sum + (b.paymentStatus === "paid" ? b.amount || 0 : 0),
        0
    );

    return NextResponse.json({
        bookings: safeBookings,
        events: safeEvents,
        stats: {
            totalBookings,
            paidBookings,
            pendingBookings,
            totalRevenue,
        },
    });
}
