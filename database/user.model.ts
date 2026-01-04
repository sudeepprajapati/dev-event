import { Schema, model, models, Types } from "mongoose";

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Please provide a name"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters"],
        },
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
            lowercase: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

export const User = models.User || model<IUser>("User", userSchema);
