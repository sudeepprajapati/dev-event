"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signupUser } from "@/lib/actions/auth.action";
import { SignupFormData } from "@/lib/types/auth";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Validation schema
const signupSchema = z
    .object({
        name: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(50, "Name must be less than 50 characters"),
        email: z.string().email("Invalid email address"),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(50, "Password must be less than 50 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: SignupFormValues) {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await signupUser(values as SignupFormData);

            if (result.success) {
                setSuccess(true);
                form.reset();
                // Redirect to signin page after 1.5 seconds
                setTimeout(() => {
                    router.push("/signin");
                }, 1500);
            } else {
                setError(result.error || "Signup failed");
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full">
            <div className="rounded-lg border border-gray-800 bg-black/50 p-8">
                <h1 className="mb-2 text-3xl font-bold text-white">Create Account</h1>
                <p className="mb-6 text-sm text-color-light-200">
                    Join us to discover amazing events
                </p>

                {error && (
                    <div className="mb-4 rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-400">
                        Account created successfully! Redirecting to signin...
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-color-light-200">Full Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="John Doe"
                                            {...field}
                                            disabled={isLoading}
                                            className="border-color-border-dark bg-color-dark-100 text-white placeholder-gray-500 focus:border-color-blue focus:ring-color-blue"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-color-light-200">Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            {...field}
                                            disabled={isLoading}
                                            className="border-color-border-dark bg-color-dark-100 text-white placeholder-gray-500 focus:border-color-blue focus:ring-color-blue"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-color-light-200">Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••"
                                            {...field}
                                            disabled={isLoading}
                                            className="border-color-border-dark bg-color-dark-100 text-white placeholder-gray-500 focus:border-color-blue focus:ring-color-blue"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-color-light-200">
                                        Confirm Password
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••"
                                            {...field}
                                            disabled={isLoading}
                                            className="border-color-border-dark bg-color-dark-100 text-white placeholder-gray-500 focus:border-color-blue focus:ring-color-blue"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-color-blue bg-primary text-black hover:bg-color-blue/90 disabled:opacity-50 font-semibold"
                        >
                            {isLoading ? "Creating account..." : "Sign Up"}
                        </Button>
                    </form>
                </Form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-color-light-200">
                        Already have an account?{" "}
                        <Link
                            href="/signin"
                            className="text-color-blue hover:text-color-light-100 transition-colors font-semibold"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
