"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CourseInfo } from "../../_lib/courseData";
import { finalStandings, splitFor } from "../../_lib/strokeplay/engine";
import type {
    StrokeplayHole,
    StrokeplayPlayer,
} from "../../_lib/strokeplay/types";

type Props = {
    players: StrokeplayPlayer[];
    holes: StrokeplayHole[];
    onEditFinalHole?: () => void;
    course?: CourseInfo | null;
};

export function GameOverBanner({ players, holes, onEditFinalHole, course = null }: Props) {
    const { winner, coWinners, tied } = finalStandings(players);
    const winnerIdx = players.findIndex((p) => p.id === winner.id);
    const winnerSplit = splitFor(winner, winnerIdx, holes, course);

    return (
        <div
            className="rounded-lg border border-primary/40 bg-primary/5 px-5 py-6 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
            role="status"
            aria-live="polite"
        >
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-1">
                {tied ? "Tied" : "Round Complete"}
            </p>
            <h2 className="font-clash text-3xl md:text-4xl font-bold leading-none mb-2">
                {tied
                    ? coWinners.map((p) => p.name).join(" & ")
                    : `${winner.name} wins`}
            </h2>
            <p className="text-sm text-muted-foreground tabular-nums">
                Net {winnerSplit.net} · Gross {winnerSplit.total} · Hcp{" "}
                {winner.handicap}
            </p>
            {onEditFinalHole && (
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={onEditFinalHole}
                >
                    <Pencil aria-hidden="true" className="w-3.5 h-3.5" /> Edit Final
                    Hole
                </Button>
            )}
        </div>
    );
}
