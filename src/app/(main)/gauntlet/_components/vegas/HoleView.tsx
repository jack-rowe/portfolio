"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { holeOutcome } from "../../_lib/vegas/engine";
import type { VegasHole, VegasPlayer, VegasTeams } from "../../_lib/vegas/types";

type Props = {
    players: VegasPlayer[];
    teams: VegasTeams;
    hole: VegasHole;
    onEdit: () => void;
};

export function HoleView({ players, teams, hole, onEdit }: Props) {
    const out = holeOutcome(hole, teams, players.length);
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
                        playerNames={teams.teamA.map((i) => players[i].name)}
                    />
                    <TeamCell
                        label="Team B"
                        number={out.numberB}
                        winner={out.winner === "B"}
                        playerNames={teams.teamB.map((i) => players[i].name)}
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
    number,
    winner,
    playerNames,
}: {
    label: string;
    number: number;
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
                {number}
            </p>
            <p className="text-xs text-muted-foreground truncate">
                {playerNames.join(" + ")}
            </p>
        </div>
    );
}
