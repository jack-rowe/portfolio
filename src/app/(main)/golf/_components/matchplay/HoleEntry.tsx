"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    bumpScoreString,
    clampScoreInput,
    ScoreInputRow,
} from "../shared/ScoreInputRow";
import { getCourse } from "../../_lib/courseData";
import { playerStrokesOnHole } from "../../_lib/handicap";
import type { HandicapConfig } from "../../_lib/handicap";
import type {
    MatchplayHole,
    MatchplayPlayer,
} from "../../_lib/matchplay/types";
import { MATCHPLAY_TOTAL_HOLES } from "../../_lib/matchplay/types";

type Props = {
    players: MatchplayPlayer[];
    holeNumber: number;
    initialScores?: number[];
    onSubmit: (hole: MatchplayHole) => void;
    inline?: boolean;
    submitLabel?: string;
    handicap?: HandicapConfig;
};

export function HoleEntry({
    players,
    holeNumber,
    initialScores,
    onSubmit,
    inline = false,
    submitLabel,
    handicap,
}: Props) {
    const holeIndex = holeNumber - 1;
    const course = getCourse(handicap?.courseId);
    const [scores, setScores] = useState<string[]>(() =>
        players.map((_, i) =>
            initialScores?.[i] === undefined ? "" : String(initialScores[i]),
        ),
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

    const canSubmit = scores.every((s) => {
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) && n > 0;
    });

    const submit = () => {
        if (!canSubmit) return;
        onSubmit({ scores: scores.map((s) => Number.parseInt(s, 10)) });
    };

    const submitButton = (
        <Button
            className="w-full h-12 text-base font-semibold tracking-wide"
            onClick={submit}
            disabled={!canSubmit}
            aria-label={`Submit hole ${String(holeNumber)} of ${String(MATCHPLAY_TOTAL_HOLES)}`}
        >
            {submitLabel ?? `Submit Hole ${String(holeNumber)}`}
        </Button>
    );

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {players.map((p, i) => (
                    <ScoreInputRow
                        key={p.id}
                        name={p.name}
                        strokeDots={playerStrokesOnHole(i, holeIndex, handicap, course)}
                        value={scores[i]}
                        onChange={(v) => {
                            setVal(i, v);
                        }}
                        onBump={(d) => {
                            bump(i, d);
                        }}
                    />
                ))}
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
