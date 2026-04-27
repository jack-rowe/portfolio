"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { holeOutcome, splitForTeam } from "../../_lib/scramble/engine";
import type { ScrambleState } from "../../_lib/scramble/types";
import {
    SCRAMBLE_FRONT_NINE,
    TEAM_LABELS,
} from "../../_lib/scramble/types";

type Props = {
    state: ScrambleState;
    activeHoleIndex: number | null;
    onSelectHole: (holeIndex: number) => void;
};

const COL_WIDTH = "w-12";
const SPLIT_COL_WIDTH = "w-14";
const TEAM_COL_WIDTH = "w-32";

export function Scorecard({ state, activeHoleIndex, onSelectHole }: Props) {
    const teamCount = state.teams.length;
    const isStroke = state.format === "strokeplay";

    const outcomes = useMemo(
        () => state.holes.map((h) => holeOutcome(h, teamCount)),
        [state.holes, teamCount],
    );
    const splits = useMemo(
        () => state.teams.map((_, i) => splitForTeam(i, state.holes)),
        [state.teams, state.holes],
    );

    if (state.holes.length === 0) return null;

    const front = state.holes.slice(0, SCRAMBLE_FRONT_NINE);
    const back = state.holes.slice(SCRAMBLE_FRONT_NINE);
    const showSplits = isStroke;

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
                            className={`${TEAM_COL_WIDTH} shrink-0 sticky left-0 z-10 bg-card border-r border-border px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center`}
                        >
                            Team
                        </div>
                        {front.map((_, h) => (
                            <HoleHeader
                                key={`hd-f-${String(h)}`}
                                holeIdx={h}
                                outcome={outcomes[h]}
                                showWinner={!isStroke && teamCount > 1}
                                active={activeHoleIndex === h}
                                onSelect={onSelectHole}
                            />
                        ))}
                        {showSplits && front.length > 0 && (
                            <SplitHeader label="F9" />
                        )}
                        {back.map((_, h) => {
                            const idx = h + SCRAMBLE_FRONT_NINE;
                            return (
                                <HoleHeader
                                    key={`hd-b-${String(idx)}`}
                                    holeIdx={idx}
                                    outcome={outcomes[idx]}
                                    showWinner={!isStroke && teamCount > 1}
                                    active={activeHoleIndex === idx}
                                    onSelect={onSelectHole}
                                />
                            );
                        })}
                        {showSplits && back.length > 0 && (
                            <SplitHeader label="B9" />
                        )}
                        <div
                            className={`${COL_WIDTH} shrink-0 py-2 text-center font-clash text-xs font-bold uppercase tracking-wider text-muted-foreground border-l border-border bg-card sticky right-0 z-10`}
                        >
                            Tot
                        </div>
                    </div>

                    {state.teams.map((team, ti) => {
                        const split = splits[ti];
                        const teamLabel =
                            teamCount === 1
                                ? "Team"
                                : TEAM_LABELS[ti] ?? String(ti + 1);
                        const memberNames = team
                            .map((idx) => state.players[idx]?.name ?? "")
                            .filter(Boolean);
                        return (
                            <div
                                key={`tr-${String(ti)}`}
                                className="flex border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                            >
                                <div
                                    className={`${TEAM_COL_WIDTH} shrink-0 sticky left-0 z-10 bg-card border-r border-border px-4 py-3 flex flex-col justify-center min-w-0`}
                                >
                                    <span className="font-clash text-base font-bold text-foreground leading-tight">
                                        {teamCount === 1
                                            ? "Team"
                                            : `Team ${teamLabel}`}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground leading-tight break-words">
                                        {memberNames.join(" + ")}
                                    </span>
                                </div>
                                {front.map((h, hi) => (
                                    <HoleCell
                                        key={`c-${String(ti)}-${String(hi)}`}
                                        score={h.teamScores[ti]}
                                        isBest={
                                            !isStroke &&
                                            teamCount > 1 &&
                                            outcomes[hi].result === "win" &&
                                            outcomes[hi].bestTeams[0] === ti
                                        }
                                        active={activeHoleIndex === hi}
                                        onClick={() => {
                                            onSelectHole(hi);
                                        }}
                                    />
                                ))}
                                {showSplits && front.length > 0 && (
                                    <SplitCell value={split.front} />
                                )}
                                {back.map((h, hi) => {
                                    const idx = hi + SCRAMBLE_FRONT_NINE;
                                    return (
                                        <HoleCell
                                            key={`c-${String(ti)}-${String(idx)}`}
                                            score={h.teamScores[ti]}
                                            isBest={
                                                !isStroke &&
                                                teamCount > 1 &&
                                                outcomes[idx].result ===
                                                "win" &&
                                                outcomes[idx].bestTeams[0] ===
                                                ti
                                            }
                                            active={activeHoleIndex === idx}
                                            onClick={() => {
                                                onSelectHole(idx);
                                            }}
                                        />
                                    );
                                })}
                                {showSplits && back.length > 0 && (
                                    <SplitCell value={split.back} />
                                )}
                                <div
                                    className={`${COL_WIDTH} shrink-0 py-3 text-center font-clash text-base font-bold tabular-nums text-foreground border-l border-border bg-card sticky right-0 z-10`}
                                >
                                    {split.total}
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
    outcome,
    showWinner,
    active,
    onSelect,
}: {
    holeIdx: number;
    outcome: { result: "win" | "halve"; bestTeams: number[] };
    showWinner: boolean;
    active: boolean;
    onSelect: (i: number) => void;
}) {
    const winnerLabel =
        showWinner && outcome.result === "win"
            ? (TEAM_LABELS[outcome.bestTeams[0]] ?? "?")
            : showWinner
                ? "—"
                : "";
    return (
        <button
            type="button"
            onClick={() => {
                onSelect(holeIdx);
            }}
            aria-current={active ? "true" : undefined}
            className={cn(
                `${COL_WIDTH} shrink-0 py-2 px-1 font-clash text-sm font-bold tabular-nums border-r border-border/50 transition-colors`,
                active
                    ? "bg-primary/15 text-primary ring-2 ring-inset ring-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
        >
            <div>{holeIdx + 1}</div>
            {winnerLabel && (
                <div className="text-[9px] font-normal text-muted-foreground tabular-nums">
                    {winnerLabel}
                </div>
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
    isBest,
    active,
    onClick,
}: {
    score: number;
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
                `${COL_WIDTH} shrink-0 py-3 border-r border-border/50 transition-colors`,
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
