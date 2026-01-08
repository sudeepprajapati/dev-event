'use client';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function TagInput({ label, values, onChange }: any) {
    const [input, setInput] = useState("");

    const add = () => {
        if (!input.trim()) return;
        onChange([...values, input.trim()]);
        setInput("");
    };

    return (
        <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-color-light-200">{label}</label>

            <div className="flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} className="border-color-border-dark bg-color-dark-100 text-white placeholder-gray-500 focus:border-color-blue focus:ring-color-blue" />
                <Button type="button" variant="secondary" onClick={add}>
                    Add
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {values.map((v: string, i: number) => (
                    <span
                        key={i}
                        className="pill cursor-pointer hover:opacity-80 flex items-center gap-2"
                        onClick={() => onChange(values.filter((_: any, idx: number) => idx !== i))}
                    >
                        {v}
                        <X className="h-3 w-3" />
                    </span>
                ))}
            </div>
        </div>
    );
}
