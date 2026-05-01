"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCourse } from "../../_lib/courseData";
import { playerStrokesOnHole } from "../../_lib/handicap";
import { holeOutcome } from "../../_lib/lcr/engine";
import type { LcrHole, LcrPlayer, LcrState } from "../../_lib/lcr/types";

type Props = {
    players: LcrPlayer[];
    holeIndex: number;
    hole: LcrHole;
    onEdit?: () => void;
    handicap?: LcrState["handicap"];
};

export function HoleView({ players, holeIndex, hole, onEdit, handicap }: Props) {
    const course = getCourse(handicap?.courseId);
    const out = holeOutcome(hole, players.length, holeIndex, {
        handicap,
        course,
    });
    const centerName = players[out.centerIndex].name;
    const outsideNames = out.outsideTeam.map((i) => players[i].name);
    const centerPlayers = [{ name: centerName, dots: playerStrokesOnHole(out.centerIndex, holeIndex, handicap, course) }];
    const outsidePlayers = out.outsideTeam.map((i) => ({
        name: players[i].name,
        dots: playerStrokesOnHole(i, holeIndex, handicap, course),
    }));

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
                    players={centerPlayers}
                />
                <SideCell
                    label="Outside (best ball)"
                    score={out.outsideBest}
                    winner={out.winner === "outside"}
                    players={outsidePlayers}
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

function SideCell({
    label,
    score,
    winner,
    players,
}: {
    label: string;
    score: number;
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
                {score}
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
