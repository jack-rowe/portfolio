"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
    holeNumber: number;
    totalHoles: number;
    label: "Now playing" | "Viewing" | "Final";
    canPrev: boolean;
    canNext: boolean;
    onPrev: () => void;
    onNext: () => void;
};

export function HoleNavigator({
    holeNumber,
    totalHoles,
    label,
    canPrev,
    canNext,
    onPrev,
    onNext,
}: Props) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-2 py-2">
            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={onPrev}
                disabled={!canPrev}
                aria-label="Previous hole"
            >
                <ChevronLeft aria-hidden="true" className="w-5 h-5" />
            </Button>
            <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {label}
                </span>
                <span className="font-clash text-2xl font-bold mt-1">
                    Hole {holeNumber}
                    <span className="text-muted-foreground/60 text-base font-normal">
                        {" "}
                        / {totalHoles}
                    </span>
                </span>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={onNext}
                disabled={!canNext}
                aria-label="Next hole"
            >
                <ChevronRight aria-hidden="true" className="w-5 h-5" />
            </Button>
        </div>
    );
}
