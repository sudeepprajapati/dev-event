import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import Event from './event.model';

/**
 * Booking document interface for type safety
 */
interface IBooking extends Document {
    eventId: Types.ObjectId;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Booking schema with reference to Event
 */
const bookingSchema = new Schema<IBooking>(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event ID is required'],
            index: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            validate: {
                validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
                message: 'Invalid email format',
            },
        },
    },
    { timestamps: true }
);

/**
 * Pre-save hook: Validate that referenced Event exists
 * Ensures referential integrity before saving booking
 */
bookingSchema.pre<IBooking>('save', async function () {
    try {
        const eventExists = await Event.findById(this.eventId);
        if (!eventExists) {
            throw new Error(`Event with ID "${this.eventId}" does not exist`);
        }
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error('Error validating event reference');
    }
});

/**
 * Export Booking model or reuse existing one
 */
const Booking: Model<IBooking> =
    mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
