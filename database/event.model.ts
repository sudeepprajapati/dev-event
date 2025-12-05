import mongoose, { Schema, Model, Document } from 'mongoose';

/**
 * Event document interface for type safety
 */
interface IEvent extends Document {
    title: string;
    slug: string;
    description: string;
    overview: string;
    image: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    audience: string;
    agenda: string[];
    organizer: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Event schema with validation and auto-generated fields
 */
const eventSchema = new Schema<IEvent>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            unique: true,
            index: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        overview: {
            type: String,
            required: [true, 'Overview is required'],
            trim: true,
            maxlength: [500, 'Overview cannot exceed 500 characters'],
        },
        image: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        venue: {
            type: String,
            required: [true, 'Venue is required'],
            trim: true,
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
        },
        date: {
            type: String,
            required: [true, 'Date is required'],
        },
        time: {
            type: String,
            required: [true, 'Time is required'],
        },
        mode: {
            type: String,
            required: [true, 'Mode is required'],
            enum: {
                values: ['online', 'offline', 'hybrid'],
                message: 'Mode must be either online, offline, or hybrid',
            }
        },
        audience: {
            type: String,
            required: [true, 'Audience is required'],
            trim: true,
        },
        agenda: {
            type: [String],
            required: [true, 'Agenda is required'],
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: 'Agenda must have at least one item',
            },
        },
        organizer: {
            type: String,
            required: [true, 'Organizer is required'],
            trim: true,
        },
        tags: {
            type: [String],
            required: [true, 'Tags are required'],
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: 'Tags must have at least one item',
            },
        },
    },
    { timestamps: true }
);

/**
 * Pre-save hook: Generate slug from title and normalize date/time
 * - Slug only regenerated if title changes
 * - Date normalized to ISO format
 * - Time formatted as HH:mm
 */
eventSchema.pre<IEvent>('save', async function () {
    // Generate slug only if title is new or modified
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Normalize date to ISO format (YYYY-MM-DD)
    if (this.isModified('date')) {
        const dateObj = new Date(this.date);
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date format');
        }
        this.date = dateObj.toISOString().split('T')[0];
    }

    // Normalize time to HH:mm format
    if (this.isModified('time')) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(this.time)) {
            throw new Error('Time must be in HH:mm format');
        }
    }
});

/**
 * Prevent duplicate slugs by ensuring uniqueness on save
 */
eventSchema.pre<IEvent>('save', async function () {
    if (this.isModified('slug') || this.isNew) {
        const existingEvent = await mongoose.model<IEvent>('Event').findOne(
            { slug: this.slug, _id: { $ne: this._id } }
        );
        if (existingEvent) {
            throw new Error(`Slug "${this.slug}" already exists`);
        }
    }
});

/**
 * Export Event model or reuse existing one
 */
const Event: Model<IEvent> =
    mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);

export default Event;
