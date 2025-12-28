"use server";

import { User } from "@/database/user.model";
import { hashPassword } from "@/lib/auth/password";
import { SignupFormData } from "@/lib/types/auth";
import connectDB from "../mongodb";

export async function signupUser(data: SignupFormData) {
    try {
        // Connect to database
        await connectDB();

        const { name, email, password, confirmPassword } = data;

        // Validate inputs
        if (!name || !email || !password) {
            return {
                success: false,
                error: "Missing required fields",
                status: 400,
            };
        }

        // Validate password match
        if (password !== confirmPassword) {
            return {
                success: false,
                error: "Passwords do not match",
                status: 400,
            };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                error: "Invalid email format",
                status: 400,
            };
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return {
                success: false,
                error: "Email already registered",
                status: 409,
            };
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        await user.save();

        // Return success without exposing password
        return {
            success: true,
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            status: 201,
        };
    } catch (error) {
        console.error("Signup error:", error);

        // Check for duplicate key error
        if (error instanceof Error && "code" in error && error.code === 11000) {
            return {
                success: false,
                error: "Email already registered",
                status: 409,
            };
        }

        return {
            success: false,
            error: "An unexpected error occurred. Please try again.",
            status: 500,
        };
    }
}
