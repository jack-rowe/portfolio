"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCourse } from "../../_lib/courseData";
import { playerStrokesOnHole } from "../../_lib/handicap";
import { holeOutcome } from "../../_lib/vegas/engine";
import type { VegasHole, VegasPlayer, VegasState, VegasTeams } from "../../_lib/vegas/types";

type Props = {
    players: VegasPlayer[];
    teams: VegasTeams;
    hole: VegasHole;
    holeIndex: number;
    onEdit?: () => void;
    handicap?: VegasState["handicap"];
};

export function HoleView({ players, teams, hole, holeIndex, onEdit, handicap }: Props) {
    const course = getCourse(handicap?.courseId);
    const out = holeOutcome(hole, teams, players.length, holeIndex, {
        handicap,
        course,
    });
    const winnerLabel =
        out.winner === "tie" ? "Tied" : `Team ${out.winner} +${out.diff}`;

    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="grid grid-cols-2 gap-2 flex-1">
                    <TeamCell
                        label="Team A"
                        number={out.numberA}
                        winner={out.winner === "A"}
                        players={teams.teamA.map((i) => ({ name: players[i].name, dots: playerStrokesOnHole(i, holeIndex, handicap, course) }))}
                    />
                    <TeamCell
                        label="Team B"
                        number={out.numberB}
                        winner={out.winner === "B"}
                        players={teams.teamB.map((i) => ({ name: players[i].name, dots: playerStrokesOnHole(i, holeIndex, handicap, course) }))}
                    />
                </div>
            </div>
            <div className="text-center">
                <p
                    className={cn(
                        "text-xs uppercase tracking-[0.2em] font-medium",
                        out.winner === "tie"
                            ? "text-muted-foreground"
                            : "text-primary",
                    )}
                >
                    {winnerLabel}
                </p>
            </div>
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
    number,
    winner,
    players,
}: {
    label: string;
    number: number;
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
                {number}
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
