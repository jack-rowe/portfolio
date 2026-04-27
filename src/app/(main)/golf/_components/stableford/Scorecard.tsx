"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CourseInfo } from "../../_lib/courseData";
import { pointsPerHole, splitFor } from "../../_lib/stableford/engine";
import type {
    StablefordHole,
    StablefordPlayer,
    StablefordState,
} from "../../_lib/stableford/types";
import { STABLEFORD_FRONT_NINE } from "../../_lib/stableford/types";

type Props = {
    players: StablefordPlayer[];
    holes: StablefordHole[];
    activeHoleIndex: number | null;
    onSelectHole: (holeIndex: number) => void;
    course: CourseInfo;
    handicap?: StablefordState["handicap"];
};

const COL_WIDTH = "w-12";
const SPLIT_COL_WIDTH = "w-14";
const PLAYER_COL_WIDTH = "w-32";

export function Scorecard({
    players,
    holes,
    activeHoleIndex,
    onSelectHole,
    course,
    handicap,
}: Props) {
    const splits = useMemo(
        () => players.map((_, i) => splitFor(i, holes, handicap, course)),
        [players, holes, handicap, course],
    );
    const ptsPerHole = useMemo(
        () => pointsPerHole(holes, handicap, course),
        [holes, handicap, course],
    );
    const bestPerHole = useMemo(
        () => ptsPerHole.map((row) => Math.max(...row)),
        [ptsPerHole],
    );

    if (holes.length === 0) return null;

    const frontHoles = holes.slice(0, STABLEFORD_FRONT_NINE);
    const backHoles = holes.slice(STABLEFORD_FRONT_NINE);

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
                        {frontHoles.map((_, h) => (
                            <HoleHeader
                                key={`hd-f-${String(h)}`}
                                holeIdx={h}
                                par={course.holes[h]?.par}
                                active={activeHoleIndex === h}
                                onSelect={onSelectHole}
                            />
                        ))}
                        {frontHoles.length > 0 && <SplitHeader label="F9" />}
                        {backHoles.map((_, h) => {
                            const idx = h + STABLEFORD_FRONT_NINE;
                            return (
                                <HoleHeader
                                    key={`hd-b-${String(idx)}`}
                                    holeIdx={idx}
                                    par={course.holes[idx]?.par}
                                    active={activeHoleIndex === idx}
                                    onSelect={onSelectHole}
                                />
                            );
                        })}
                        {backHoles.length > 0 && <SplitHeader label="B9" />}
                        <div
                            className={`${COL_WIDTH} shrink-0 py-2 text-center font-clash text-xs font-bold uppercase tracking-wider text-muted-foreground border-l border-border bg-card sticky right-0 z-10`}
                        >
                            Pts
                        </div>
                    </div>

                    {players.map((p, i) => {
                        const split = splits[i];
                        return (
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
                                {frontHoles.map((h, hi) => (
                                    <HoleCell
                                        key={`c-${p.id}-${String(hi)}`}
                                        score={h.scores[i]}
                                        points={ptsPerHole[hi][i]}
                                        isBest={
                                            players.length > 1 &&
                                            ptsPerHole[hi][i] === bestPerHole[hi] &&
                                            ptsPerHole[hi][i] > 0
                                        }
                                        active={activeHoleIndex === hi}
                                        onClick={() => {
                                            onSelectHole(hi);
                                        }}
                                    />
                                ))}
                                {frontHoles.length > 0 && (
                                    <SplitCell value={split.frontPoints} />
                                )}
                                {backHoles.map((h, hi) => {
                                    const idx = hi + STABLEFORD_FRONT_NINE;
                                    return (
                                        <HoleCell
                                            key={`c-${p.id}-${String(idx)}`}
                                            score={h.scores[i]}
                                            points={ptsPerHole[idx][i]}
                                            isBest={
                                                players.length > 1 &&
                                                ptsPerHole[idx][i] ===
                                                bestPerHole[idx] &&
                                                ptsPerHole[idx][i] > 0
                                            }
                                            active={activeHoleIndex === idx}
                                            onClick={() => {
                                                onSelectHole(idx);
                                            }}
                                        />
                                    );
                                })}
                                {backHoles.length > 0 && (
                                    <SplitCell value={split.backPoints} />
                                )}
                                <div
                                    className={`${COL_WIDTH} shrink-0 py-3 text-center font-clash text-base font-bold tabular-nums text-foreground border-l border-border bg-card sticky right-0 z-10`}
                                >
                                    {split.totalPoints}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function HoleHeader({
    holeIdx,
    par,
    active,
    onSelect,
}: {
    holeIdx: number;
    par: number | undefined;
    active: boolean;
    onSelect: (i: number) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => {
                onSelect(holeIdx);
            }}
            aria-current={active ? "true" : undefined}
            className={cn(
                `${COL_WIDTH} shrink-0 py-2 px-1 font-clash text-sm font-bold tabular-nums border-r border-border/50 transition-colors leading-tight`,
                active
                    ? "bg-primary/15 text-primary ring-2 ring-inset ring-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
        >
            <span className="block">{holeIdx + 1}</span>
            {par !== undefined && (
                <span className="block text-[9px] font-normal opacity-60">
                    P{par}
                </span>
            )}
        </button>
    );
}

function SplitHeader({ label }: { label: string }) {
    return (
        <div
            className={`${SPLIT_COL_WIDTH} shrink-0 py-2 text-center font-clash text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-l border-border bg-muted/30`}
        >
            {label}
        </div>
    );
}

function HoleCell({
    score,
    points,
    isBest,
    active,
    onClick,
}: {
    score: number;
    points: number;
    isBest: boolean;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={active ? "true" : undefined}
            className={cn(
                `${COL_WIDTH} shrink-0 py-2 border-r border-border/50 transition-colors leading-tight`,
                active
                    ? "bg-primary/15 ring-2 ring-inset ring-primary"
                    : isBest
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted/40",
            )}
        >
            <span
                className={cn(
                    "block font-clash text-base font-bold tabular-nums",
                    isBest ? "text-primary" : "text-muted-foreground",
                )}
            >
                {score}
            </span>
            <span className="block text-[10px] tabular-nums text-muted-foreground">
                {points}
            </span>
        </button>
    );
}

function SplitCell({ value }: { value: number }) {
    return (
        <div
            className={`${SPLIT_COL_WIDTH} shrink-0 py-3 text-center font-clash text-base font-bold tabular-nums text-foreground border-r border-l border-border bg-muted/30`}
        >
            {value}
        </div>
    );
}
