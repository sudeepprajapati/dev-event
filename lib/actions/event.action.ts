'use server';

import { Event } from "@/database";
import connectDB from "../mongodb";

export const getSimilarEventsBySlug = async (slug: string) => {
    try {
        await connectDB();

        const event = await Event.findOne({ slug });

        return await Event.find({ _id: { $ne: event?._id }, tags: { $in: event?.tags } }).lean();
    } catch {
        return [];
    }
}

export const getEventBySlug = async (slug: string) => {
    try {
        await connectDB();

        const event = await Event.findOne({ slug }).lean();

        if (!event) return null;

        return {
            ...event,
            _id: event._id.toString(),
        };
    } catch {
        return null;
    }
}

export const getEventById = async (id: string) => {
    try {
        await connectDB();
        const event = await Event.findById(id).lean();

        if (!event) return null;

        return {
            ...event,
            _id: event._id.toString(),
            organizerId: event.organizerId?.toString?.() ?? event.organizerId,
        };
    } catch {
        return null;
    }
}

export const getEventsByOrganizerId = async (organizerId: string) => {
    try {
        await connectDB();
        const events = await Event.find({ organizerId })
            .sort({ createdAt: -1 })
            .lean();

        return events.map((event: any) => ({
            ...event,
            _id: event._id.toString(),
            organizerId: event.organizerId?.toString?.() ?? event.organizerId,
        }));
    } catch {
        return [];
    }
}

export const getAllEvents = async () => {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 }).lean();

        return events.map((event: any) => ({
            ...event,
            _id: event._id.toString(),
        }));
    } catch {
        return [];
    }
}
