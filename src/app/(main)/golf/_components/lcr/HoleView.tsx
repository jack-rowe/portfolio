"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { holeOutcome } from "../../_lib/lcr/engine";
import type { LcrHole, LcrPlayer } from "../../_lib/lcr/types";

type Props = {
    players: LcrPlayer[];
    holeIndex: number;
    hole: LcrHole;
    onEdit: () => void;
};

export function HoleView({ players, holeIndex, hole, onEdit }: Props) {
    const out = holeOutcome(hole, players.length);
    const centerName = players[out.centerIndex].name;
    const outsideNames = out.outsideTeam.map((i) => players[i].name);

    let banner: string;
    if (out.winner === "center") banner = `${centerName} (Center) takes 2`;
    else if (out.winner === "outside")
        banner = `Outside (${outsideNames.join(" + ")}) takes 1 each`;
    else banner = "Wash";

    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                Hole {holeIndex + 1}
            </p>
            <div className="grid grid-cols-2 gap-2">
                <SideCell
                    label="Center"
                    score={out.centerScore}
                    winner={out.winner === "center"}
                    playerNames={[centerName]}
                />
                <SideCell
                    label="Outside (best ball)"
                    score={out.outsideBest}
                    winner={out.winner === "outside"}
                    playerNames={outsideNames}
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

function SideCell({
    label,
    score,
    winner,
    playerNames,
}: {
    label: string;
    score: number;
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
                {score}
            </p>
            <p className="text-xs text-muted-foreground truncate">
                {playerNames.join(" + ")}
            </p>
        </div>
    );
}
