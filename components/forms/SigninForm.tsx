"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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

// Validation schema
const signinSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type SigninFormValues = z.infer<typeof signinSchema>;

export function SigninForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for error from NextAuth
    const callbackError = searchParams?.get("error");

    const form = useForm<SigninFormValues>({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: SigninFormValues) {
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email: values.email,
                password: values.password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error || "Invalid credentials");
            } else if (result?.ok) {
                // Redirect to home page on successful signin
                router.push("/");
            }
        } catch (err) {
            console.error("Signin error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full">
            <div className="rounded-lg border border-gray-800 bg-black/50 p-8">
                <h1 className="mb-2 text-2xl font-bold text-white">Welcome Back</h1>
                <p className="mb-6 text-sm text-color-light-200">
                    Sign in to your Dev Events account
                </p>

                {(error || callbackError) && (
                    <div className="mb-4 rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                        {error ||
                            (callbackError === "CredentialsSignin"
                                ? "Invalid email or password"
                                : callbackError)}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-color-blue text-black bg-primary hover:bg-color-blue/90 disabled:opacity-50 font-semibold"
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </Form>

                <div className="mt-6 space-y-3 text-center">
                    <p className="text-sm text-color-light-200">
                        Don't have an account?{" "}
                        <Link
                            href="/signup"
                            className="text-color-blue hover:text-color-light-100 transition-colors font-semibold"
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
