"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCourse } from "../../_lib/courseData";
import { playerStrokesOnHole } from "../../_lib/handicap";
import { holeOutcome } from "../../_lib/hollywood/engine";
import type {
    HollywoodHole,
    HollywoodPlayer,
    HollywoodState,
} from "../../_lib/hollywood/types";

const SEGMENT_LABELS = ["Front 6", "Middle 6", "Back 6"];

type Props = {
    players: HollywoodPlayer[];
    holeIndex: number;
    hole: HollywoodHole;
    onEdit?: () => void;
    handicap?: HollywoodState["handicap"];
};

export function HoleView({ players, holeIndex, hole, onEdit, handicap }: Props) {
    const course = getCourse(handicap?.courseId);
    const out = holeOutcome(hole, holeIndex, players.length, {
        handicap,
        course,
    });
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
                    players={out.teamA.map((i) => ({ name: players[i].name, dots: playerStrokesOnHole(i, holeIndex, handicap, course) }))}
                />
                <TeamCell
                    label="Team B"
                    best={out.bestB}
                    winner={out.winner === "B"}
                    players={out.teamB.map((i) => ({ name: players[i].name, dots: playerStrokesOnHole(i, holeIndex, handicap, course) }))}
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
            {onEdit && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={onEdit}
                >
                    <Pencil aria-hidden="true" className="w-3.5 h-3.5" /> Edit hole
                </Button>
            )}
        </div>
    );
}

function TeamCell({
    label,
    best,
    winner,
    players,
}: {
    label: string;
    best: number;
    winner: boolean;
    players: { name: string; dots: number }[];
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
            <div className="space-y-0.5">
                {players.map(({ name, dots }) => (
                    <div key={name} className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground truncate">{name}</span>
                        {dots > 0 && (
                            <span
                                className="flex items-center gap-0.5 shrink-0"
                                aria-label={`${String(dots)} handicap stroke${dots > 1 ? "s" : ""}`}
                            >
                                {Array.from({ length: dots }, (_, k) => (
                                    <span
                                        key={k}
                                        aria-hidden="true"
                                        className="w-1.5 h-1.5 rounded-full bg-primary"
                                    />
                                ))}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
