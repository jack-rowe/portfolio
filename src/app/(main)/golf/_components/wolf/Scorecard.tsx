"use client";

import { useMemo } from "react";
import { Eye, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCourse } from "../../_lib/courseData";
import { holeOutcome, wolfFor } from "../../_lib/wolf/engine";
import type { WolfHole, WolfPlayer, WolfState } from "../../_lib/wolf/types";

type Props = {
    players: WolfPlayer[];
    holes: WolfHole[];
    activeHoleIndex: number | null;
    onSelectHole: (holeIndex: number) => void;
    handicap?: WolfState["handicap"];
};

const COL_WIDTH = "w-12";
const PLAYER_COL_WIDTH = "w-32";

export function Scorecard({
    players,
    holes,
    activeHoleIndex,
    onSelectHole,
    handicap,
}: Props) {
    const outcomes = useMemo(
        () => {
            const ctx = { handicap, course: getCourse(handicap?.courseId) };
            return holes.map((h, i) => holeOutcome(h, i, players.length, ctx));
        },
        [holes, players.length, handicap],
    );

    if (holes.length === 0) return null;

    const totals = players.map((_, i) =>
        holes.reduce((sum, h) => sum + (h.scores[i] ?? 0), 0),
    );

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
                <h2 className="font-clash text-base font-bold tracking-wide uppercase text-muted-foreground">
                    Scorecard
                </h2>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Trophy
                            aria-hidden="true"
                            className="w-3 h-3 text-primary"
                        />
                        Won hole
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Eye
                            aria-hidden="true"
                            className="w-3 h-3 text-primary"
                        />
                        Blind
                    </span>
                </div>
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
                            const wolfIdx = wolfFor(h, players.length);
                            const wolfName = players[wolfIdx]?.name ?? "";
                            const blind =
                                holes[h].decision.kind === "lone" &&
                                holes[h].decision.blind;
                            return (
                                <button
                                    key={`hd-${String(h)}`}
                                    type="button"
                                    onClick={() => {
                                        onSelectHole(h);
                                    }}
                                    aria-label={`Go to hole ${String(h + 1)}, wolf ${wolfName}`}
                                    aria-current={active ? "true" : undefined}
                                    className={cn(
                                        `${COL_WIDTH} shrink-0 py-2 px-1 font-clash text-sm font-bold tabular-nums border-r border-border/50 transition-colors`,
                                        active
                                            ? "bg-primary/15 text-primary ring-2 ring-inset ring-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    )}
                                >
                                    <div>{h + 1}</div>
                                    <div className="text-[9px] font-normal truncate flex items-center justify-center gap-0.5">
                                        {blind && (
                                            <Eye
                                                aria-hidden="true"
                                                className="w-2.5 h-2.5"
                                            />
                                        )}
                                        {wolfName.slice(0, 4)}
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
                            </div>
                            {holes.map((h, hi) => {
                                const score = h.scores[i];
                                const o = outcomes[hi];
                                const active = activeHoleIndex === hi;
                                const onWolfTeam = o.wolfTeam.includes(i);
                                const award = o.award[i];
                                const won = award > 0;
                                return (
                                    <button
                                        key={`c-${p.id}-${String(hi)}`}
                                        type="button"
                                        onClick={() => {
                                            onSelectHole(hi);
                                        }}
                                        aria-label={`${p.name}, hole ${String(hi + 1)}, scored ${String(score)}${won ? `, won ${String(award)}` : ""}`}
                                        aria-current={active ? "true" : undefined}
                                        className={cn(
                                            `${COL_WIDTH} shrink-0 relative py-3 border-r border-border/50 transition-colors`,
                                            active
                                                ? "bg-primary/15 ring-2 ring-inset ring-primary"
                                                : onWolfTeam
                                                    ? "bg-primary/5 hover:bg-primary/10"
                                                    : "hover:bg-muted/40",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "block font-clash text-base font-bold tabular-nums",
                                                won
                                                    ? "text-primary"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {score}
                                        </span>
                                        {won && (
                                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-primary tabular-nums">
                                                +{award}
                                            </span>
                                        )}
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
