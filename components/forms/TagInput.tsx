'use client';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TagInput({ label, values, onChange }: any) {
    const [input, setInput] = useState("");

    const add = () => {
        if (!input.trim()) return;
        onChange([...values, input.trim()]);
        setInput("");
    };

    return (
        <div className="flex flex-col gap-4">
            <label className="text-sm font-medium">{label}</label>

            <div className="flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} />
                <Button type="button" variant="secondary" onClick={add}>
                    Add
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {values.map((v: string, i: number) => (
                    <span
                        key={i}
                        className="pill cursor-pointer hover:opacity-80"
                        onClick={() => onChange(values.filter((_: any, idx: number) => idx !== i))}
                    >
                        {v} ✕
                    </span>
                ))}
            </div>
        </div>
    );
}
