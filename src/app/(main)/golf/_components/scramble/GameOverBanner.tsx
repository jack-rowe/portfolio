"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { splitForTeam, standings } from "../../_lib/scramble/engine";
import type { ScrambleState } from "../../_lib/scramble/types";
import { TEAM_LABELS } from "../../_lib/scramble/types";

type Props = {
    state: ScrambleState;
    onEditFinalHole?: () => void;
};

export function GameOverBanner({ state, onEditFinalHole }: Props) {
    const teamCount = state.teams.length;
    const { winners, tied } = standings(state);

    let title: string;
    let subtitle: string;

    if (teamCount === 1) {
        const split = splitForTeam(0, state.holes);
        title = "Round Complete";
        subtitle = `Team total: ${String(split.total)} strokes`;
    } else {
        const winnerNames = winners
            .map((ti) => `Team ${TEAM_LABELS[ti] ?? String(ti + 1)}`)
            .join(" & ");
        title = tied ? `${winnerNames} tied` : `${winnerNames} wins`;
        if (state.format === "strokeplay") {
            const winnerTotals = winners
                .map((ti) => splitForTeam(ti, state.holes).total)
                .join(", ");
            subtitle = `Total ${winnerTotals}`;
        } else {
            const winnerPts = winners.map((ti) => {
                const member = state.teams[ti][0];
                return state.players[member]?.points ?? 0;
            });
            subtitle = `${String(winnerPts[0])} hole${winnerPts[0] === 1 ? "" : "s"} won`;
        }
    }

    return (
        <div
            className="rounded-lg border border-primary/40 bg-primary/5 px-5 py-6 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
            role="status"
            aria-live="polite"
        >
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-1">
                {tied && teamCount > 1 ? "Tied" : "Round Complete"}
            </p>
            <h2 className="font-clash text-3xl md:text-4xl font-bold leading-none mb-2">
                {title}
            </h2>
            <p className="text-sm text-muted-foreground tabular-nums">
                {subtitle}
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
