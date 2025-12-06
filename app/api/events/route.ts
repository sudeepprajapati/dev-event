import { Event } from "@/database";
import { v2 as cloudinary } from 'cloudinary';
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

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

        const arrayBuffer = await file.arrayBuffer();

        const buffer = Buffer.from(arrayBuffer)

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                if (error) return reject(error);

                resolve(results);

            }).end(buffer);
        })

        event.image = (uploadResult as { secure_url: string }).secure_url;
        const createdEvent = await Event.create(event);

        return NextResponse.json({ message: 'Event created successfully', event: createdEvent },
            { status: 201 })
    } catch (e) {
        console.log(e);
        return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
    }
}