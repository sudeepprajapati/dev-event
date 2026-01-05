'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import TagInput from "./TagInput";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Schema */
/* ------------------------------------------------------------------ */

const eventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    overview: z.string().min(10, "Overview must be at least 10 characters"),
    venue: z.string().min(2, "Venue must be at least 2 characters"),
    location: z.string().min(2, "Location must be at least 2 characters"),
    audience: z.string().min(5, "Audience must be at least 5 characters"),
    organizer: z.string().min(2, "Organizer must be at least 2 characters"),
    date: z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        "Invalid date format"
    ),
    time: z.string().regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Time must be in HH:mm format"
    ),
    mode: z.enum(["online", "offline", "hybrid"]),
    price: z.string().refine(
        (val) => {
            const num = Number(val);
            return !isNaN(num) && num >= 0;
        },
        "Price must be a valid non-negative number"
    ),
}).refine(
    (data) => !(data.mode === 'offline' && Number(data.price) === 0),
    {
        path: ["price"],
        message: "Offline events cannot be free"
    }
);

type EventFormValues = z.infer<typeof eventSchema>;

/* ------------------------------------------------------------------ */
/* Native Date/Time Input (DO NOT replace with shadcn Input) */
/* ------------------------------------------------------------------ */

function DateTimeInput(
    props: React.InputHTMLAttributes<HTMLInputElement>
) {
    return (
        <input
            {...props}
            className={cn(
                "bg-dark-200 text-foreground rounded-md px-5 py-2.5",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                "appearance-auto",
                props.className
            )}
        />
    );
}

/* ------------------------------------------------------------------ */
/* Main Form */
/* ------------------------------------------------------------------ */

export default function CreateEventForm({
    initialEvent,
    mode = 'create'
}: {
    initialEvent?: any;
    mode?: 'create' | 'edit';
}) {
    const { data: session } = useSession();
    const router = useRouter();

    const [tags, setTags] = useState<string[]>(initialEvent?.tags ?? []);
    const [agenda, setAgenda] = useState<string[]>(initialEvent?.agenda ?? []);
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session?.user?.email) {
            router.push('/auth/signin');
        }
    }, [session, router]);

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: initialEvent?.title ?? "",
            description: initialEvent?.description ?? "",
            overview: initialEvent?.overview ?? "",
            venue: initialEvent?.venue ?? "",
            location: initialEvent?.location ?? "",
            audience: initialEvent?.audience ?? "",
            organizer: initialEvent?.organizer ?? "",
            date: initialEvent?.date ?? "",
            time: initialEvent?.time ?? "",
            mode: initialEvent?.mode ?? "online",
            price: String(initialEvent?.price ?? 0),
        },
        mode: "onTouched",
    });

    const onSubmit = async (values: EventFormValues) => {
        if (!session?.user?.email) {
            setError('Please sign in to create an event');
            return;
        }

        if (!image && mode === 'create') {
            setError('Image is required');
            return;
        }

        if (tags.length === 0) {
            setError('At least one tag is required');
            return;
        }

        if (agenda.length === 0) {
            setError('At least one agenda item is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const priceNum = Number(values.price);
            formData.append("price", String(isNaN(priceNum) ? 0 : priceNum));

            if (image) {
                formData.append("image", image);
            }
            formData.append("tags", JSON.stringify(tags));
            formData.append("agenda", JSON.stringify(agenda));

            const method = mode === 'edit' ? 'PUT' : 'POST';
            const endpoint = mode === 'edit' ? `/api/organizer/events/${initialEvent._id}` : '/api/events';

            const response = await fetch(endpoint, {
                method,
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to save event');
                return;
            }

            if (mode === 'create') {
                router.push('/organizer/events');
            } else {
                router.push('/organizer/events');
            }

            form.reset();
            setTags([]);
            setAgenda([]);
            setImage(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-12"
            >
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* ---------------- Basic Info ---------------- */}
                <Section title="Basic Information">
                    <TwoCol>
                        <TextField control={form.control} name="title" label="Event Title" />
                        <TextField control={form.control} name="venue" label="Venue" />
                    </TwoCol>

                    <TwoCol>
                        <TextField control={form.control} name="location" label="Location" />
                        <TextField control={form.control} name="organizer" label="Organizer" />
                    </TwoCol>

                    <TextField
                        control={form.control}
                        name="audience"
                        label="Target Audience"
                        placeholder="Fullstack developers, DevOps, AI researchers"
                    />

                    <TextAreaField
                        control={form.control}
                        name="description"
                        label="Short Description"
                    />

                    <TextAreaField
                        control={form.control}
                        name="overview"
                        label="Overview"
                        rows={4}
                    />
                </Section>

                {/* ---------------- Schedule ---------------- */}
                <Section title="Schedule">
                    <ThreeCol>
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <DateTimeInput
                                            type="date"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                        <DateTimeInput
                                            type="time"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mode</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select mode" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="offline">Offline</SelectItem>
                                            <SelectItem value="hybrid">Hybrid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </ThreeCol>
                </Section>

                {/* ---------------- Pricing ---------------- */}
                <Section title="Pricing">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price (₹)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="0 for free event"
                                        {...field}
                                        min="0"
                                        step="1"
                                    />
                                </FormControl>
                                <p className="text-sm text-gray-400 mt-1">
                                    {Number(field.value) === 0 ? "Free event" : `Paid event - ₹${field.value}`}
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </Section>

                {/* ---------------- Media ---------------- */}
                <Section title="Event Poster">
                    {mode === 'edit' && initialEvent?.image && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-2">Current Image</p>
                            <img src={initialEvent.image} alt="Current" className="h-32 rounded-lg" />
                        </div>
                    )}
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                    />
                    {mode === 'edit' && !image && (
                        <p className="text-xs text-gray-400 mt-2">Leave empty to keep current image</p>
                    )}
                </Section>

                {/* ---------------- Details ---------------- */}
                <Section title="Details">
                    <TwoCol>
                        <TagInput label="Tags" values={tags} onChange={setTags} />
                        <TagInput label="Agenda Items" values={agenda} onChange={setAgenda} />
                    </TwoCol>
                </Section>

                <Button size="lg" className="text-black" disabled={loading}>
                    {loading ? (mode === 'edit' ? "Updating..." : "Creating...") : (mode === 'edit' ? "Update Event" : "Create Event")}
                </Button>
            </form>
        </Form>
    );
}

/* ------------------------------------------------------------------ */
/* Small Layout Helpers */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-6">
            <h3>{title}</h3>
            {children}
        </div>
    );
}

function TwoCol({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;
}

function ThreeCol({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Field Helpers */
/* ------------------------------------------------------------------ */

function TextField({
    control,
    name,
    label,
    placeholder,
}: {
    control: any;
    name: string;
    label: string;
    placeholder?: string;
}) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder={placeholder} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function TextAreaField({
    control,
    name,
    label,
    rows,
}: {
    control: any;
    name: string;
    label: string;
    rows?: number;
}) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Textarea {...field} value={field.value ?? ""} rows={rows || 3} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
