"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    bumpScoreString,
    clampScoreInput,
    ScoreInputRow,
} from "../shared/ScoreInputRow";
import { getCourse } from "../../_lib/courseData";
import { playerStrokesOnHole } from "../../_lib/handicap";
import type { HandicapConfig } from "../../_lib/handicap";
import type { LcrHole, LcrPlayer } from "../../_lib/lcr/types";
import { LCR_TOTAL_HOLES } from "../../_lib/lcr/types";

type Props = {
    players: LcrPlayer[];
    holeNumber: number;
    initialHole?: LcrHole;
    onSubmit: (hole: LcrHole) => void;
    inline?: boolean;
    submitLabel?: string;
    handicap?: HandicapConfig;
};

export function HoleEntry({
    players,
    holeNumber,
    initialHole,
    onSubmit,
    inline = false,
    submitLabel,
    handicap,
}: Props) {
    const holeIndex = holeNumber - 1;
    const course = getCourse(handicap?.courseId);
    const [scores, setScores] = useState<string[]>(() =>
        players.map((_, i) => {
            const v = initialHole?.scores[i];
            return v === undefined ? "" : String(v);
        }),
    );
    const [centerIndex, setCenterIndex] = useState<number | null>(
        initialHole?.centerIndex ?? null,
    );

    const setVal = (i: number, v: string) => {
        setScores((prev) => {
            const next = [...prev];
            next[i] = clampScoreInput(v);
            return next;
        });
    };

    const bump = (i: number, delta: number) => {
        setScores((prev) => {
            const next = [...prev];
            next[i] = bumpScoreString(prev[i], delta);
            return next;
        });
    };

    const scoresValid = scores.every((s) => {
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) && n > 0;
    });
    const canSubmit = scoresValid && centerIndex !== null;

    const submit = () => {
        if (!canSubmit || centerIndex === null) return;
        onSubmit({
            scores: scores.map((s) => Number.parseInt(s, 10)),
            centerIndex,
        });
    };

    const submitButton = (
        <Button
            className="w-full h-12 text-base font-semibold tracking-wide"
            onClick={submit}
            disabled={!canSubmit}
            aria-label={`Submit hole ${String(holeNumber)} of ${String(LCR_TOTAL_HOLES)}`}
        >
            {submitLabel ?? `Submit Hole ${String(holeNumber)}`}
        </Button>
    );

    return (
        <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    Who hit Center? (based on tee shot)
                </p>
                <div
                    role="radiogroup"
                    aria-label="Center player"
                    className="grid grid-cols-3 gap-1"
                >
                    {players.map((p, i) => {
                        const selected = centerIndex === i;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => {
                                    setCenterIndex(i);
                                }}
                                className={cn(
                                    "rounded-md border px-2 py-2 font-clash text-sm font-bold truncate transition-colors",
                                    selected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-card text-foreground hover:border-foreground/40",
                                )}
                            >
                                {p.name}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="space-y-2">
                {players.map((p, i) => {
                    const isCenter = i === centerIndex;
                    let badgeLabel = "Outside";
                    if (centerIndex === null) {
                        badgeLabel = "—";
                    } else if (isCenter) {
                        badgeLabel = "Center";
                    }
                    return (
                        <ScoreInputRow
                            key={p.id}
                            name={p.name}
                            badges={
                                <span
                                    className={cn(
                                        "text-[10px] uppercase tracking-[0.15em] font-bold",
                                        isCenter
                                            ? "text-primary"
                                            : "text-foreground/60",
                                    )}
                                >
                                    {badgeLabel}
                                </span>
                            }
                            strokeDots={playerStrokesOnHole(i, holeIndex, handicap, course)}
                            value={scores[i]}
                            onChange={(v) => {
                                setVal(i, v);
                            }}
                            onBump={(d) => {
                                bump(i, d);
                            }}
                        />
                    );
                })}
            </div>
            {inline ? (
                submitButton
            ) : (
                <div className="fixed bottom-0 inset-x-0 z-20 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-gradient-to-t from-background via-background to-background/80 border-t border-border md:static md:p-0 md:border-0 md:bg-none md:from-transparent md:to-transparent">
                    <div className="max-w-2xl mx-auto md:max-w-none">{submitButton}</div>
                </div>
            )}
        </div>
    );
}
