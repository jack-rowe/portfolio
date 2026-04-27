"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
    icon: ReactNode;
    title: string;
    /** Optional small label under/next to the title (e.g. scramble layout). */
    subtitle?: ReactNode;
};

/**
 * Sticky header for read-only share recaps. Provides a "Back to Golf" link
 * and a "Copy link" button that copies the current URL.
 */
export function RecapHeader({ icon, title, subtitle }: Props) {
    const handleCopy = () => {
        if (typeof window === "undefined") return;
        const url = window.location.href;
        const writer =
            typeof navigator !== "undefined" && navigator.clipboard
                ? navigator.clipboard.writeText.bind(navigator.clipboard)
                : null;
        if (writer) {
            writer(url).then(
                () => toast.success("Link copied"),
                () => toast.error("Could not copy link"),
            );
        } else {
            toast.error("Clipboard unavailable");
        }
    };

    return (
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border py-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
                {icon}
                <div className="min-w-0">
                    <span className="font-clash text-2xl font-bold tracking-tight block leading-none truncate">
                        {title}
                    </span>
                    {subtitle && (
                        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-foreground gap-1.5"
                >
                    <Share2 aria-hidden="true" className="w-3.5 h-3.5" /> Copy
                    link
                </Button>
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground gap-1.5"
                >
                    <Link href="/golf">
                        <ChevronLeft
                            aria-hidden="true"
                            className="w-3.5 h-3.5"
                        />{" "}
                        Golf
                    </Link>
                </Button>
            </div>
        </header>
    );
}
