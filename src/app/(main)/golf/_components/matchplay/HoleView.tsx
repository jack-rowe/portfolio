"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { holeOutcome } from "../../_lib/matchplay/engine";
import type {
    MatchplayHole,
    MatchplayPlayer,
} from "../../_lib/matchplay/types";

type Props = {
    players: MatchplayPlayer[];
    holeIndex: number;
    hole: MatchplayHole;
    onEdit: () => void;
};

export function HoleView({ players, holeIndex, hole, onEdit }: Props) {
    const out = holeOutcome(hole, players.length);
    let banner: string;
    if (out.result === "halve") banner = "Halved";
    else banner = `${players[out.bestPlayers[0]].name} wins +1`;

    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                Hole {holeIndex + 1}
            </p>
            <div
                className={cn(
                    "grid gap-2",
                    players.length === 2
                        ? "grid-cols-2"
                        : players.length === 3
                            ? "grid-cols-3"
                            : "grid-cols-4",
                )}
            >
                {players.map((p, i) => {
                    const isWinner =
                        out.result === "win" && out.bestPlayers[0] === i;
                    const isBest = out.bestPlayers.includes(i);
                    return (
                        <div
                            key={p.id}
                            className={cn(
                                "rounded-md border px-2 py-2 text-center",
                                isWinner
                                    ? "border-primary bg-primary/10"
                                    : isBest
                                        ? "border-primary/40"
                                        : "border-border",
                            )}
                        >
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground truncate">
                                {p.name}
                            </p>
                            <p
                                className={cn(
                                    "font-clash text-2xl font-bold tabular-nums leading-tight",
                                    isWinner
                                        ? "text-primary"
                                        : "text-foreground",
                                )}
                            >
                                {hole.scores[i]}
                            </p>
                        </div>
                    );
                })}
            </div>
            <p
                className={cn(
                    "text-center text-xs uppercase tracking-[0.2em] font-medium",
                    out.result === "halve"
                        ? "text-muted-foreground"
                        : "text-primary",
                )}
            >
                {banner}
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
