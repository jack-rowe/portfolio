"use client";

import { cn } from "@/lib/utils";
import { splitForTeam, teamPoints } from "../../_lib/scramble/engine";
import type { ScrambleState } from "../../_lib/scramble/types";
import { TEAM_LABELS } from "../../_lib/scramble/types";

type Props = {
    state: ScrambleState;
    isGameOver: boolean;
};

export function Leaderboard({ state, isGameOver }: Props) {
    const teamCount = state.teams.length;
    const isStroke = state.format === "strokeplay";
    const rows = state.teams.map((team, ti) => {
        const split = splitForTeam(ti, state.holes);
        const pts = teamPoints(state, ti);
        const memberNames = team
            .map((idx) => state.players[idx]?.name ?? "")
            .filter(Boolean);
        return { ti, split, pts, memberNames };
    });

    const sorted = [...rows].sort((a, b) =>
        isStroke ? a.split.total - b.split.total : b.pts - a.pts,
    );

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
                <h2 className="font-clash text-base font-bold tracking-wide uppercase text-muted-foreground">
                    {isGameOver ? "Final Standings" : "Standings"}
                </h2>
            </div>
            <ul className="divide-y divide-border" aria-label="Leaderboard">
                {sorted.map((row, i) => {
                    const tieKey = isStroke ? row.split.total : row.pts;
                    const rank =
                        sorted.findIndex(
                            (x) =>
                                (isStroke ? x.split.total : x.pts) === tieKey,
                        ) + 1;
                    const tied =
                        sorted.filter(
                            (x) =>
                                (isStroke ? x.split.total : x.pts) === tieKey,
                        ).length > 1;
                    const teamLabel =
                        teamCount === 1
                            ? "Team"
                            : `Team ${TEAM_LABELS[row.ti] ?? String(row.ti + 1)}`;
                    return (
                        <li
                            key={`r-${String(row.ti)}`}
                            className="flex items-center gap-4 px-4 py-3"
                        >
                            <span
                                aria-label={`Rank ${tied ? "tied " : ""}${String(rank)}`}
                                className={cn(
                                    "font-clash text-2xl font-bold w-10 leading-none tabular-nums",
                                    i === 0
                                        ? "text-primary"
                                        : "text-muted-foreground/40",
                                )}
                            >
                                {tied && teamCount > 1 ? "T" : ""}
                                {rank}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                                    {teamLabel}
                                </div>
                                <div className="font-semibold text-sm break-words">
                                    {row.memberNames.join(" + ")}
                                </div>
                                {isStroke && state.holes.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                                        F9 {row.split.front} · B9{" "}
                                        {row.split.back}
                                    </div>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-clash text-xl font-bold text-foreground leading-none tabular-nums">
                                    {isStroke
                                        ? row.split.total
                                        : `+${String(row.pts)}`}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {isStroke ? "strokes" : "holes"}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
