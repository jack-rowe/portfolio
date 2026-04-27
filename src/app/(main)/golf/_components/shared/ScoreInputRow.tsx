"use client";

import { useId } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const QUICK_SCORES = [2, 3, 4, 5, 6, 7];

type Props = {
    name: string;
    /** Optional badges to render to the right of the player name. */
    badges?: React.ReactNode;
    value: string;
    onChange: (v: string) => void;
    onBump: (delta: number) => void;
};

export function ScoreInputRow({
    name,
    badges,
    value,
    onChange,
    onBump,
}: Props) {
    const inputId = useId();
    const liveId = `${inputId}-live`;
    const hasScore = value !== "" && Number.parseInt(value, 10) > 0;

    return (
        <div
            className={cn(
                "rounded-lg border bg-card transition-colors px-3 py-2",
                hasScore ? "border-primary/40" : "border-border",
            )}
        >
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="font-clash text-lg font-bold text-foreground truncate">
                        {name}
                    </span>
                    {badges}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 touch-manipulation border-border"
                    onClick={() => {
                        onBump(-1);
                    }}
                    aria-label={`Decrease ${name}'s score`}
                >
                    <Minus aria-hidden="true" className="!w-5 !h-5" />
                </Button>
                <Label htmlFor={inputId} className="sr-only">
                    {name}&apos;s score
                </Label>
                <Input
                    id={inputId}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={value}
                    placeholder="–"
                    aria-describedby={liveId}
                    className={cn(
                        "h-11 flex-1 text-center font-clash text-2xl font-bold tabular-nums transition-colors",
                        hasScore
                            ? "border-primary text-primary bg-primary/5"
                            : "border-border text-foreground",
                    )}
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
                    className="h-11 w-11 shrink-0 touch-manipulation border-border"
                    onClick={() => {
                        onBump(1);
                    }}
                    aria-label={`Increase ${name}'s score`}
                >
                    <Plus aria-hidden="true" className="!w-5 !h-5" />
                </Button>
            </div>

            <div className="grid grid-cols-6 gap-1.5 mt-2">
                {QUICK_SCORES.map((q) => {
                    const active = value === String(q);
                    return (
                        <Button
                            key={q}
                            type="button"
                            variant={active ? "default" : "outline"}
                            className={cn(
                                "h-10 text-sm font-bold touch-manipulation border-border",
                                active
                                    ? "ring-1 ring-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => {
                                onChange(String(q));
                            }}
                            aria-label={`Set ${name}'s score to ${String(q)}`}
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

/** Strip non-digits and clamp to 1-99. */
export function clampScoreInput(raw: string): string {
    const digits = raw.replaceAll(/\D/g, "");
    if (digits === "") return "";
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n > 99) return "99";
    return String(n);
}

/** Bump a score string by delta, treating empty as 0 and clamping >= 1. */
export function bumpScoreString(prev: string, delta: number): string {
    const current = Number.parseInt(prev, 10);
    const base = Number.isFinite(current) ? current : 0;
    return String(Math.max(1, base + delta));
}
