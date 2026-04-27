"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    bumpScoreString,
    clampScoreInput,
} from "../shared/ScoreInputRow";
import type {
    ScrambleHole,
    ScramblePlayer,
} from "../../_lib/scramble/types";
import { SCRAMBLE_TOTAL_HOLES, TEAM_LABELS } from "../../_lib/scramble/types";

type Props = {
    players: ScramblePlayer[];
    teams: number[][];
    holeNumber: number;
    initialScores?: number[];
    onSubmit: (hole: ScrambleHole) => void;
    inline?: boolean;
    submitLabel?: string;
};

export function HoleEntry({
    players,
    teams,
    holeNumber,
    initialScores,
    onSubmit,
    inline = false,
    submitLabel,
}: Props) {
    const [scores, setScores] = useState<string[]>(() =>
        teams.map((_, i) =>
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
        onSubmit({
            teamScores: scores.map((s) => Number.parseInt(s, 10)),
        });
    };

    const submitButton = (
        <Button
            className="w-full h-12 text-base font-semibold tracking-wide"
            onClick={submit}
            disabled={!canSubmit}
            aria-label={`Submit hole ${String(holeNumber)} of ${String(SCRAMBLE_TOTAL_HOLES)}`}
        >
            {submitLabel ?? `Submit Hole ${String(holeNumber)}`}
        </Button>
    );

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {teams.map((team, ti) => {
                    const value = scores[ti];
                    const hasScore =
                        value !== "" && Number.parseInt(value, 10) > 0;
                    const teamName =
                        teams.length === 1
                            ? "Team"
                            : `Team ${TEAM_LABELS[ti] ?? String(ti + 1)}`;
                    const memberNames = team
                        .map((idx) => players[idx]?.name ?? "")
                        .filter(Boolean);
                    return (
                        <div
                            key={`team-${String(ti)}`}
                            className={cn(
                                "rounded-lg border bg-card transition-colors px-3 py-2",
                                hasScore
                                    ? "border-primary/40"
                                    : "border-border",
                            )}
                        >
                            <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                                        {teamName}
                                    </p>
                                    <p className="font-clash text-base font-bold text-foreground break-words">
                                        {memberNames.join(" + ")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11 shrink-0 touch-manipulation border-border"
                                    onClick={() => {
                                        bump(ti, -1);
                                    }}
                                    aria-label={`Decrease ${teamName}'s score`}
                                >
                                    <Minus
                                        aria-hidden="true"
                                        className="!w-5 !h-5"
                                    />
                                </Button>
                                <Label
                                    htmlFor={`scramble-team-${String(ti)}`}
                                    className="sr-only"
                                >
                                    {teamName} score
                                </Label>
                                <Input
                                    id={`scramble-team-${String(ti)}`}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="off"
                                    value={value}
                                    placeholder="–"
                                    className={cn(
                                        "h-11 flex-1 text-center font-clash text-2xl font-bold tabular-nums transition-colors",
                                        hasScore
                                            ? "border-primary text-primary bg-primary/5"
                                            : "border-border text-foreground",
                                    )}
                                    onChange={(e) => {
                                        setVal(ti, e.target.value);
                                    }}
                                    onFocus={(e) => {
                                        e.target.select();
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11 shrink-0 touch-manipulation border-border"
                                    onClick={() => {
                                        bump(ti, 1);
                                    }}
                                    aria-label={`Increase ${teamName}'s score`}
                                >
                                    <Plus
                                        aria-hidden="true"
                                        className="!w-5 !h-5"
                                    />
                                </Button>
                            </div>
                            <div className="grid grid-cols-6 gap-1.5 mt-2">
                                {[2, 3, 4, 5, 6, 7].map((q) => {
                                    const active = value === String(q);
                                    return (
                                        <Button
                                            key={q}
                                            type="button"
                                            variant={
                                                active ? "default" : "outline"
                                            }
                                            className={cn(
                                                "h-10 text-sm font-bold touch-manipulation border-border",
                                                active
                                                    ? "ring-1 ring-primary"
                                                    : "text-muted-foreground hover:text-foreground",
                                            )}
                                            onClick={() => {
                                                setVal(ti, String(q));
                                            }}
                                            aria-pressed={active}
                                        >
                                            {q}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            {inline ? (
                submitButton
            ) : (
                <div className="fixed bottom-0 inset-x-0 z-20 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-gradient-to-t from-background via-background to-background/80 border-t border-border md:static md:p-0 md:border-0 md:bg-none md:from-transparent md:to-transparent">
                    <div className="max-w-2xl mx-auto md:max-w-none">
                        {submitButton}
                    </div>
                </div>
            )}
        </div>
    );
}
