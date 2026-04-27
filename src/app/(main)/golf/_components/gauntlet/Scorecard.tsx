"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { holeOutcomes, resetPlayers } from "../../_lib/gauntlet/engine";
import type { HoleScores, Player } from "../../_lib/gauntlet/types";

type Props = {
    players: Player[];
    holes: HoleScores[];
    activeHoleIndex: number | null;
    onSelectHole: (holeIndex: number) => void;
};

const COL_WIDTH = "w-12";
const PLAYER_COL_WIDTH = "w-32";

export function Scorecard({
    players,
    holes,
    activeHoleIndex,
    onSelectHole,
}: Props) {
    const outcomes = useMemo(
        () => holeOutcomes(resetPlayers(players), holes),
        [players, holes],
    );

    if (holes.length === 0) return null;

    const totals = players.map((_, i) =>
        holes.reduce((sum, h) => sum + (h[i] ?? 0), 0),
    );

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
                <h2 className="font-clash text-base font-bold tracking-wide uppercase text-muted-foreground">
                    Scorecard
                </h2>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="block w-1.5 h-1.5 rounded-full bg-primary"
                        />
                        Advanced
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Trophy
                            aria-hidden="true"
                            className="w-3 h-3 text-primary"
                        />
                        Gauntlet
                    </span>
                </div>
            </header>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Header row */}
                    <div className="flex border-b border-border bg-card">
                        <div
                            className={`${PLAYER_COL_WIDTH} shrink-0 sticky left-0 z-10 bg-card border-r border-border px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center`}
                        >
                            Player
                        </div>
                        {holes.map((_, h) => {
                            const active = activeHoleIndex === h;
                            return (
                                <button
                                    key={`hd-${String(h)}`}
                                    type="button"
                                    onClick={() => {
                                        onSelectHole(h);
                                    }}
                                    aria-label={`Go to hole ${String(h + 1)}`}
                                    aria-current={active ? "true" : undefined}
                                    className={`${COL_WIDTH} shrink-0 py-2 font-clash text-sm font-bold tabular-nums border-r border-border/50 transition-colors ${active
                                        ? "bg-primary/15 text-primary ring-2 ring-inset ring-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    {h + 1}
                                </button>
                            );
                        })}
                        <div
                            className={`${COL_WIDTH} shrink-0 py-2 text-center font-clash text-xs font-bold uppercase tracking-wider text-muted-foreground border-l border-border bg-card sticky right-0 z-10`}
                        >
                            Tot
                        </div>
                    </div>

                    {/* Body rows */}
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
                                const score = h[i];
                                const outcome = outcomes[hi][i];
                                const active = activeHoleIndex === hi;
                                return (
                                    <button
                                        key={`c-${p.id}-${String(hi)}`}
                                        type="button"
                                        onClick={() => {
                                            onSelectHole(hi);
                                        }}
                                        aria-label={describeCell(
                                            p.name,
                                            hi + 1,
                                            score,
                                            outcome.advanced,
                                            outcome.gauntlet,
                                        )}
                                        aria-current={active ? "true" : undefined}
                                        className={`${COL_WIDTH} shrink-0 relative py-3 border-r border-border/50 transition-colors ${active
                                            ? "bg-primary/15 ring-2 ring-inset ring-primary"
                                            : "hover:bg-muted/40"
                                            }`}
                                    >
                                        <span
                                            className={`block font-clash text-base font-bold tabular-nums ${outcome.advanced
                                                ? "text-primary"
                                                : "text-muted-foreground"
                                                }`}
                                        >
                                            {score}
                                        </span>
                                        {outcome.gauntlet ? (
                                            <Trophy
                                                aria-hidden="true"
                                                className="absolute top-1 right-1 w-2.5 h-2.5 text-primary"
                                            />
                                        ) : outcome.advanced ? (
                                            <span
                                                aria-hidden="true"
                                                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                                            />
                                        ) : null}
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

function describeCell(
    name: string,
    holeNumber: number,
    score: number,
    advanced: boolean,
    gauntlet: boolean,
): string {
    const base = `${name}, hole ${String(holeNumber)}, scored ${String(score)}`;
    if (gauntlet) return `${base}, completed a gauntlet`;
    if (advanced) return `${base}, advanced`;
    return base;
}
