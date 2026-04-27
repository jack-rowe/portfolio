"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { holeOutcome } from "../../_lib/hollywood/engine";
import type {
    HollywoodHole,
    HollywoodPlayer,
} from "../../_lib/hollywood/types";

const SEGMENT_LABELS = ["Front 6", "Middle 6", "Back 6"];

type Props = {
    players: HollywoodPlayer[];
    holeIndex: number;
    hole: HollywoodHole;
    onEdit: () => void;
};

export function HoleView({ players, holeIndex, hole, onEdit }: Props) {
    const out = holeOutcome(hole, holeIndex, players.length);
    const segLabel = SEGMENT_LABELS[out.segment];
    const winnerLabel =
        out.winner === "tie" ? "Halved" : `Team ${out.winner} wins hole`;

    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                {segLabel}
            </p>
            <div className="grid grid-cols-2 gap-2">
                <TeamCell
                    label="Team A"
                    best={out.bestA}
                    winner={out.winner === "A"}
                    playerNames={out.teamA.map((i) => players[i].name)}
                />
                <TeamCell
                    label="Team B"
                    best={out.bestB}
                    winner={out.winner === "B"}
                    playerNames={out.teamB.map((i) => players[i].name)}
                />
            </div>
            <p
                className={cn(
                    "text-center text-xs uppercase tracking-[0.2em] font-medium",
                    out.winner === "tie"
                        ? "text-muted-foreground"
                        : "text-primary",
                )}
            >
                {winnerLabel}
            </p>
            <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={onEdit}
            >
                <Pencil aria-hidden="true" className="w-3.5 h-3.5" /> Edit hole
            </Button>
        </div>
    );
}

function TeamCell({
    label,
    best,
    winner,
    playerNames,
}: {
    label: string;
    best: number;
    winner: boolean;
    playerNames: string[];
}) {
    return (
        <div
            className={cn(
                "rounded-md border px-3 py-2",
                winner ? "border-primary bg-primary/10" : "border-border",
            )}
        >
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {label}
            </p>
            <p
                className={cn(
                    "font-clash text-2xl font-bold tabular-nums leading-tight",
                    winner ? "text-primary" : "text-foreground",
                )}
            >
                {best}
            </p>
            <p className="text-xs text-muted-foreground truncate">
                {playerNames.join(" + ")}
            </p>
        </div>
    );
}
