import { Event, User } from "@/database";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from 'cloudinary';
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/authOptions";

export async function POST(req: NextRequest) {
    try {
        // AUTH CHECK: Only authenticated users can create events
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Unauthorized: Please sign in' }, { status: 401 });
        }

        await connectDB();

        // Get organizer user from session email
        const organizer = await User.findOne({ email: session.user.email });
        if (!organizer) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const formData = await req.formData();

        let event;

        try {
            event = Object.fromEntries(formData);
        } catch (e) {
            return NextResponse.json({ message: 'Invalid JSON data format' }, { status: 400 })
        }

        const file = formData.get('image') as File;

        if (!file || file.size === 0) {
            return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
        }

        let tags = JSON.parse(formData.get('tags') as string);
        let agenda = JSON.parse(formData.get('agenda') as string);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer)

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            }).end(buffer);
        })

        event.image = (uploadResult as { secure_url: string }).secure_url;
        // Inject organizerId from session
        event.organizerId = organizer._id;

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda
        });

        return NextResponse.json({ message: 'Event created successfully', event: createdEvent },
            { status: 201 })
    } catch (e) {
        console.log(e);
        return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: "Events fetched successfully", events }, { status: 200 })
    } catch (e) {
        return NextResponse.json({ message: "Event fetching failed", error: e }, { status: 500 })
    }
}

