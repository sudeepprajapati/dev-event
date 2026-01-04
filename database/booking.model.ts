import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import Event from './event.model';

/**
 * Booking document interface for type safety
 */
interface IBooking extends Document {
    eventId: Types.ObjectId;
    userId?: Types.ObjectId;
    email: string;
    amount?: number;
    paymentStatus?: 'pending' | 'paid' | 'failed';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
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
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
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
        amount: {
            type: Number,
            min: 0,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        },
        razorpayOrderId: {
            type: String,
        },
        razorpayPaymentId: {
            type: String,
        },
    },
    { timestamps: true }
);

// Unique index to prevent duplicate booking for same user/email and event
bookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

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

        const existingBooking = await mongoose.models.Booking.findOne({
            eventId: this.eventId,
            email: this.email,
        });

        if (existingBooking && existingBooking._id.toString() !== this._id.toString()) {
            throw new Error(`You have already booked this event`);
        }
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error('Error validating booking');
    }
});

/**
 * Export Booking model or reuse existing one
 */
const Booking: Model<IBooking> =
    mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
