import { cn } from "@/lib/utils";

interface DateTimeInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

export function DateTimeInput({
    className,
    ...props
}: DateTimeInputProps) {
    return (
        <input
            {...props}
            className={cn(
                "bg-dark-200 text-foreground rounded-md px-5 py-2.5",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                "appearance-auto", // 🔑 critical
                className
            )}
        />
    );
}
