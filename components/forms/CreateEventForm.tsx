'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
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
    title: z.string().min(3),
    description: z.string().min(10),
    overview: z.string().min(10),
    venue: z.string().min(2),
    location: z.string().min(2),
    audience: z.string().min(5),
    organizer: z.string().min(2),
    date: z.string(),
    time: z.string(),
    mode: z.enum(["online", "offline", "hybrid"]),
});

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

export default function CreateEventForm() {
    const [tags, setTags] = useState<string[]>([]);
    const [agenda, setAgenda] = useState<string[]>([]);
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: "",
            description: "",
            overview: "",
            venue: "",
            location: "",
            audience: "",
            organizer: "",
            date: "",
            time: "",
            mode: undefined,
        },
    });

    const onSubmit = async (values: EventFormValues) => {
        if (!image || tags.length === 0 || agenda.length === 0) return;

        setLoading(true);

        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) =>
            formData.append(key, value)
        );

        formData.append("image", image);
        formData.append("tags", JSON.stringify(tags));
        formData.append("agenda", JSON.stringify(agenda));

        await fetch("/api/events", {
            method: "POST",
            body: formData,
        });

        setLoading(false);
        form.reset();
        setTags([]);
        setAgenda([]);
        setImage(null);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-12"
            >

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

                {/* ---------------- Media ---------------- */}
                <Section title="Event Poster">
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files?.[0] || null)}
                    />
                </Section>

                {/* ---------------- Details ---------------- */}
                <Section title="Details">
                    <TwoCol>
                        <TagInput label="Tags" values={tags} onChange={setTags} />
                        <TagInput label="Agenda Items" values={agenda} onChange={setAgenda} />
                    </TwoCol>
                </Section>

                <Button size="lg" className="text-black">
                    {loading ? "Creating..." : "Create Event"}
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
}: any) {
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
}: any) {
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
