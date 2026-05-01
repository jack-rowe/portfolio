"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCourse } from "../../_lib/courseData";
import { teamStrokesOnHole } from "../../_lib/handicap";
import { holeOutcome } from "../../_lib/scramble/engine";
import type {
    ScrambleHole,
    ScramblePlayer,
    ScrambleState,
} from "../../_lib/scramble/types";
import { TEAM_LABELS } from "../../_lib/scramble/types";

type Props = {
    state: ScrambleState;
    players: ScramblePlayer[];
    holeIndex: number;
    hole: ScrambleHole;
    onEdit?: () => void;
};

export function HoleView({ state, players, holeIndex, hole, onEdit }: Props) {
    const teamCount = state.teams.length;
    const out = holeOutcome(hole, teamCount);
    const course = getCourse(state.handicap?.courseId);

    let banner: string;
    if (teamCount === 1) {
        banner = `Team scores ${String(hole.teamScores[0])}`;
    } else if (out.result === "halve") {
        banner = "Halved";
    } else {
        banner = `Team ${TEAM_LABELS[out.bestTeams[0]] ?? "?"} wins +1`;
    }

    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                Hole {holeIndex + 1}
            </p>
            <div
                className={cn(
                    "grid gap-2",
                    teamCount === 1 ? "grid-cols-1" : "grid-cols-2",
                )}
            >
                {state.teams.map((team, ti) => {
                    const isWinner =
                        out.result === "win" && out.bestTeams[0] === ti;
                    const isBest = out.bestTeams.includes(ti);
                    const memberNames = team
                        .map((idx) => players[idx]?.name ?? "")
                        .filter(Boolean);
                    const dots = teamStrokesOnHole(team, holeIndex, state.handicap, course);
                    return (
                        <div
                            key={`t-${String(ti)}`}
                            className={cn(
                                "rounded-md border px-2 py-2 text-center",
                                isWinner
                                    ? "border-primary bg-primary/10"
                                    : isBest && teamCount > 1
                                        ? "border-primary/40"
                                        : "border-border",
                            )}
                        >
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground break-words">
                                {teamCount === 1
                                    ? "Team"
                                    : `Team ${TEAM_LABELS[ti] ?? String(ti + 1)}`}
                            </p>
                            <p className="text-[11px] text-foreground/80 break-words mb-1">
                                {memberNames.join(" + ")}
                            </p>
                            {dots > 0 && (
                                <span
                                    className="flex items-center gap-0.5 justify-center mb-1"
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
                                    isWinner
                                        ? "text-primary"
                                        : "text-foreground",
                                )}
                            >
                                {hole.teamScores[ti]}
                            </p>
                        </div>
                    );
                })}
            </div>
            <p
                className={cn(
                    "text-center text-xs uppercase tracking-[0.2em] font-medium",
                    out.result === "halve" || teamCount === 1
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
