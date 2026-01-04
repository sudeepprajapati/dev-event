"use client";

interface RefreshButtonProps {
    className?: string;
}

export default function RefreshButton({ className = "" }: RefreshButtonProps) {
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <button
            onClick={handleRefresh}
            className={className}
        >
            Refresh Status
        </button>
    );
}
