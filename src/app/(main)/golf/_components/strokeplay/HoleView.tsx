"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCourse } from "../../_lib/courseData";
import { netScoresForHole, playerStrokesOnHole } from "../../_lib/handicap";
import type {
    StrokeplayHole,
    StrokeplayPlayer,
    StrokeplayState,
} from "../../_lib/strokeplay/types";

type Props = {
    players: StrokeplayPlayer[];
    holeIndex: number;
    hole: StrokeplayHole;
    onEdit?: () => void;
    handicap?: StrokeplayState["handicap"];
};

function gridColsFor(n: number): string {
    if (n <= 1) return "grid-cols-1";
    if (n === 2) return "grid-cols-2";
    if (n === 3) return "grid-cols-3";
    return "grid-cols-4";
}

export function HoleView({ players, holeIndex, hole, onEdit, handicap }: Props) {
    const course = getCourse(handicap?.courseId);
    const net = netScoresForHole(
        hole.scores,
        holeIndex,
        handicap,
        course,
    );
    const best = Math.min(...net);

    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                Hole {holeIndex + 1}
            </p>
            <div className={cn("grid gap-2", gridColsFor(players.length))}>
                {players.map((p, i) => {
                    const isBest =
                        players.length > 1 && net[i] === best;
                    const dots = playerStrokesOnHole(i, holeIndex, handicap, course);
                    return (
                        <div
                            key={p.id}
                            className={cn(
                                "rounded-md border px-2 py-2 text-center",
                                isBest
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-border",
                            )}
                        >
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground truncate">
                                {p.name}
                            </p>
                            {dots > 0 && (
                                <span
                                    className="flex items-center gap-0.5 justify-center"
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
                            <p
                                className={cn(
                                    "font-clash text-2xl font-bold tabular-nums leading-tight",
                                    isBest ? "text-primary" : "text-foreground",
                                )}
                            >
                                {hole.scores[i]}
                            </p>
                        </div>
                    );
                })}
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
