"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getCourse } from "../../_lib/courseData";
import { holeOutcome } from "../../_lib/vegas/engine";
import type { VegasHole, VegasPlayer, VegasState, VegasTeams } from "../../_lib/vegas/types";

type Props = {
    players: VegasPlayer[];
    teams: VegasTeams;
    holes: VegasHole[];
    activeHoleIndex: number | null;
    onSelectHole: (holeIndex: number) => void;
    handicap?: VegasState["handicap"];
};

const COL_WIDTH = "w-12";
const PLAYER_COL_WIDTH = "w-32";

export function Scorecard({
    players,
    teams,
    holes,
    activeHoleIndex,
    onSelectHole,
    handicap,
}: Props) {
    const outcomes = useMemo(
        () => {
            const ctx = { handicap, course: getCourse(handicap?.courseId) };
            return holes.map((h, i) => holeOutcome(h, teams, players.length, i, ctx));
        },
        [holes, teams, players.length, handicap],
    );

    if (holes.length === 0) return null;

    const totals = players.map((_, i) =>
        holes.reduce((sum, h) => sum + (h.scores[i] ?? 0), 0),
    );

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="px-4 py-3 border-b border-border">
                <h2 className="font-clash text-base font-bold tracking-wide uppercase text-muted-foreground">
                    Scorecard
                </h2>
            </header>
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    <div className="flex border-b border-border bg-card">
                        <div
                            className={`${PLAYER_COL_WIDTH} shrink-0 sticky left-0 z-10 bg-card border-r border-border px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center`}
                        >
                            Player
                        </div>
                        {holes.map((_, h) => {
                            const active = activeHoleIndex === h;
                            const o = outcomes[h];
                            return (
                                <button
                                    key={`hd-${String(h)}`}
                                    type="button"
                                    onClick={() => {
                                        onSelectHole(h);
                                    }}
                                    aria-current={active ? "true" : undefined}
                                    className={cn(
                                        `${COL_WIDTH} shrink-0 py-2 px-1 font-clash text-sm font-bold tabular-nums border-r border-border/50 transition-colors`,
                                        active
                                            ? "bg-primary/15 text-primary ring-2 ring-inset ring-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    )}
                                >
                                    <div>{h + 1}</div>
                                    <div className="text-[9px] font-normal text-muted-foreground tabular-nums">
                                        {o.winner === "tie"
                                            ? "—"
                                            : `${o.winner} +${o.diff}`}
                                    </div>
                                </button>
                            );
                        })}
                        <div
                            className={`${COL_WIDTH} shrink-0 py-2 text-center font-clash text-xs font-bold uppercase tracking-wider text-muted-foreground border-l border-border bg-card sticky right-0 z-10`}
                        >
                            Tot
                        </div>
                    </div>

                    {players.map((p, i) => (
                        <div
                            key={p.id}
                            className="flex border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                        >
                            <div
                                className={`${PLAYER_COL_WIDTH} shrink-0 sticky left-0 z-10 bg-card border-r border-border px-4 py-3 flex items-center`}
                            >
                                <span className="font-clash text-base font-bold text-foreground truncate">
                                    {p.name}
                                </span>
                                <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                                    {teams.teamA.includes(i) ? "A" : "B"}
                                </span>
                            </div>
                            {holes.map((h, hi) => {
                                const score = h.scores[i];
                                const active = activeHoleIndex === hi;
                                const o = outcomes[hi];
                                const onWinningTeam =
                                    (o.winner === "A" &&
                                        teams.teamA.includes(i)) ||
                                    (o.winner === "B" &&
                                        teams.teamB.includes(i));
                                return (
                                    <button
                                        key={`c-${p.id}-${String(hi)}`}
                                        type="button"
                                        onClick={() => {
                                            onSelectHole(hi);
                                        }}
                                        aria-current={active ? "true" : undefined}
                                        className={cn(
                                            `${COL_WIDTH} shrink-0 py-3 border-r border-border/50 transition-colors`,
                                            active
                                                ? "bg-primary/15 ring-2 ring-inset ring-primary"
                                                : onWinningTeam
                                                    ? "bg-primary/5 hover:bg-primary/10"
                                                    : "hover:bg-muted/40",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "block font-clash text-base font-bold tabular-nums",
                                                onWinningTeam
                                                    ? "text-primary"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {score}
                                        </span>
                                    </button>
                                );
                            })}
                            <div
                                className={`${COL_WIDTH} shrink-0 py-3 text-center font-clash text-base font-bold tabular-nums text-foreground border-l border-border bg-card sticky right-0 z-10`}
                            >
                                {totals[i]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
