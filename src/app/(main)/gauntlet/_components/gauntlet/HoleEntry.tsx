"use client";

import { useId, useState } from "react";
import { ArrowRight, Minus, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Player, HoleScores } from "../../_lib/gauntlet/types";
import { GAUNTLET_TOTAL_HOLES as TOTAL_HOLES } from "../../_lib/gauntlet/types";

type Props = {
    players: Player[];
    holeNumber: number;
    onSubmit: (scores: HoleScores) => void;
};

const QUICK_SCORES = [2, 3, 4, 5, 6, 7];

function clampScore(raw: string): string {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits === "") return "";
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n > 99) return "99";
    return String(n);
}

export function HoleEntry({
    players,
    holeNumber,
    onSubmit,
}: Props) {
    const [entry, setEntry] = useState<string[]>(() =>
        players.map(() => ""),
    );

    const setVal = (i: number, v: string) => {
        setEntry((prev) => {
            const next = [...prev];
            next[i] = clampScore(v);
            return next;
        });
    };

    const bump = (i: number, delta: number) => {
        setEntry((prev) => {
            const next = [...prev];
            const current = Number.parseInt(prev[i], 10);
            const base = Number.isFinite(current) ? current : 0;
            next[i] = String(Math.max(1, base + delta));
            return next;
        });
    };

    const submit = () => {
        const parsed = entry.map((s) => Number.parseInt(s, 10));
        if (parsed.some((n) => !Number.isFinite(n) || n <= 0)) return;
        onSubmit(parsed);
        setEntry(players.map(() => ""));
    };

    const canSubmit = entry.every((s) => {
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) && n > 0;
    });

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {players.map((p, i) => (
                    <PlayerRow
                        key={p.id}
                        player={p}
                        target={players[p.targetIndex]}
                        value={entry[i]}
                        onChange={(v) => {
                            setVal(i, v);
                        }}
                        onBump={(d) => {
                            bump(i, d);
                        }}
                    />
                ))}
            </div>

            <div className="fixed bottom-0 inset-x-0 z-20 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-gradient-to-t from-background via-background to-background/80 border-t border-border md:static md:p-0 md:border-0 md:bg-none md:from-transparent md:to-transparent">
                <div className="max-w-2xl mx-auto md:max-w-none">
                    <Button
                        className="w-full h-12 text-base font-semibold tracking-wide"
                        onClick={submit}
                        disabled={!canSubmit}
                        aria-label={`Submit hole ${String(holeNumber)} of ${String(TOTAL_HOLES)}`}
                    >
                        Submit Hole {holeNumber}
                    </Button>
                </div>
            </div>
        </div>
    );
}

type RowProps = {
    player: Player;
    target: Player;
    value: string;
    onChange: (v: string) => void;
    onBump: (delta: number) => void;
};

function PlayerRow({ player, target, value, onChange, onBump }: RowProps) {
    const inputId = useId();
    const liveId = `${inputId}-live`;
    const hasScore = value !== "" && Number.parseInt(value, 10) > 0;

    return (
        <div
            className={`rounded-lg border bg-card transition-colors ${hasScore ? "border-primary/40" : "border-border"
                }`}
        >
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="font-clash text-xl font-bold text-foreground leading-none truncate">
                        {player.name}
                    </span>
                    <ArrowRight
                        aria-hidden="true"
                        className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                    />
                    <span className="text-sm text-muted-foreground truncate">
                        chasing {target.name}
                    </span>
                </div>
                <div
                    className="flex items-center gap-1.5 shrink-0"
                    aria-label={`${String(player.points)} gauntlet points`}
                >
                    <Trophy aria-hidden="true" className="w-3 h-3 text-primary" />
                    <span className="text-xs font-semibold text-primary tabular-nums">
                        {player.points}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 px-3 pb-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0 touch-manipulation border-border"
                    onClick={() => {
                        onBump(-1);
                    }}
                    aria-label={`Decrease ${player.name}'s score`}
                >
                    <Minus aria-hidden="true" className="!w-5 !h-5" />
                </Button>

                <Label htmlFor={inputId} className="sr-only">
                    {player.name}&apos;s score for this hole
                </Label>
                <Input
                    id={inputId}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={value}
                    placeholder="–"
                    aria-describedby={liveId}
                    className={`h-12 flex-1 text-center font-clash text-2xl font-bold tabular-nums transition-colors ${hasScore
                        ? "border-primary text-primary bg-primary/5"
                        : "border-border text-foreground"
                        }`}
                    onChange={(e) => {
                        onChange(e.target.value);
                    }}
                    onFocus={(e) => {
                        e.target.select();
                    }}
                />
                <span id={liveId} aria-live="polite" className="sr-only">
                    {hasScore ? `${value} strokes` : "no score entered"}
                </span>

                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0 touch-manipulation border-border"
                    onClick={() => {
                        onBump(1);
                    }}
                    aria-label={`Increase ${player.name}'s score`}
                >
                    <Plus aria-hidden="true" className="!w-5 !h-5" />
                </Button>
            </div>

            <div className="grid grid-cols-6 gap-1.5 px-3 pb-3">
                {QUICK_SCORES.map((q) => {
                    const active = value === String(q);
                    return (
                        <Button
                            key={q}
                            type="button"
                            variant={active ? "default" : "outline"}
                            className={`h-10 text-sm font-bold touch-manipulation border-border ${active
                                ? "ring-1 ring-primary"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            onClick={() => {
                                onChange(String(q));
                            }}
                            aria-label={`Set ${player.name}'s score to ${String(q)}`}
                            aria-pressed={active}
                        >
                            {q}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
