"use client";

import { useId, useState } from "react";
import { Eye, Minus, Plus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { wolfFor } from "../../_lib/wolf/engine";
import type { WolfDecision, WolfHole, WolfPlayer } from "../../_lib/wolf/types";
import { WOLF_TOTAL_HOLES } from "../../_lib/wolf/types";

const QUICK_SCORES = [2, 3, 4, 5, 6, 7];

type Props = {
    players: WolfPlayer[];
    holeNumber: number;
    /** Optional initial values when editing an existing hole. */
    initialScores?: number[];
    initialDecision?: WolfDecision;
    onSubmit: (hole: WolfHole) => void;
    /** When true the submit bar stays inline (used inside Edit dialog). */
    inline?: boolean;
    submitLabel?: string;
};

type DecisionMode = "partner" | "lone" | "blind";

function clampScore(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") return "";
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n > 99) return "99";
    return String(n);
}

export function HoleEntry({
    players,
    holeNumber,
    initialScores,
    initialDecision,
    onSubmit,
    inline = false,
    submitLabel,
}: Props) {
    const wolfIdx = wolfFor(holeNumber - 1, players.length);
    const wolf = players[wolfIdx];

    const [scores, setScores] = useState<string[]>(() =>
        players.map((_, i) =>
            initialScores?.[i] !== undefined ? String(initialScores[i]) : "",
        ),
    );

    const [mode, setMode] = useState<DecisionMode>(() => {
        if (!initialDecision) return "partner";
        if (initialDecision.kind === "partner") return "partner";
        return initialDecision.blind ? "blind" : "lone";
    });

    const [partnerIdx, setPartnerIdx] = useState<number | null>(() => {
        if (initialDecision?.kind === "partner") return initialDecision.partnerIndex;
        // default: first non-wolf player
        const candidates = players
            .map((_, i) => i)
            .filter((i) => i !== wolfIdx);
        return candidates[0] ?? null;
    });

    const setVal = (i: number, v: string) => {
        setScores((prev) => {
            const next = [...prev];
            next[i] = clampScore(v);
            return next;
        });
    };

    const bump = (i: number, delta: number) => {
        setScores((prev) => {
            const next = [...prev];
            const current = Number.parseInt(prev[i], 10);
            const base = Number.isFinite(current) ? current : 0;
            next[i] = String(Math.max(1, base + delta));
            return next;
        });
    };

    const decision: WolfDecision = (() => {
        if (mode === "partner" && partnerIdx !== null) {
            return { kind: "partner", partnerIndex: partnerIdx };
        }
        if (mode === "blind") return { kind: "lone", blind: true };
        return { kind: "lone", blind: false };
    })();

    const decisionValid =
        mode !== "partner" ||
        (partnerIdx !== null && partnerIdx !== wolfIdx);

    const scoresValid = scores.every((s) => {
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) && n > 0;
    });

    const canSubmit = decisionValid && scoresValid;

    const submit = () => {
        if (!canSubmit) return;
        const parsed = scores.map((s) => Number.parseInt(s, 10));
        onSubmit({ scores: parsed, decision });
    };

    return (
        <div className="space-y-3">
            <DecisionPicker
                wolfName={wolf.name}
                players={players}
                wolfIdx={wolfIdx}
                mode={mode}
                onModeChange={setMode}
                partnerIdx={partnerIdx}
                onPartnerChange={setPartnerIdx}
            />

            <div className="space-y-2">
                {players.map((p, i) => (
                    <PlayerRow
                        key={p.id}
                        player={p}
                        isWolf={i === wolfIdx}
                        isPartner={mode === "partner" && partnerIdx === i}
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
                <Button
                    className="w-full h-12 text-base font-semibold tracking-wide"
                    onClick={submit}
                    disabled={!canSubmit}
                >
                    {submitLabel ?? `Save Hole ${String(holeNumber)}`}
                </Button>
            ) : (
                <div className="fixed bottom-0 inset-x-0 z-20 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-gradient-to-t from-background via-background to-background/80 border-t border-border md:static md:p-0 md:border-0 md:bg-none md:from-transparent md:to-transparent">
                    <div className="max-w-2xl mx-auto md:max-w-none">
                        <Button
                            className="w-full h-12 text-base font-semibold tracking-wide"
                            onClick={submit}
                            disabled={!canSubmit}
                            aria-label={`Submit hole ${String(holeNumber)} of ${String(WOLF_TOTAL_HOLES)}`}
                        >
                            {submitLabel ?? `Submit Hole ${String(holeNumber)}`}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

type DecisionPickerProps = {
    wolfName: string;
    players: WolfPlayer[];
    wolfIdx: number;
    mode: DecisionMode;
    onModeChange: (m: DecisionMode) => void;
    partnerIdx: number | null;
    onPartnerChange: (i: number) => void;
};

function DecisionPicker({
    wolfName,
    players,
    wolfIdx,
    mode,
    onModeChange,
    partnerIdx,
    onPartnerChange,
}: DecisionPickerProps) {
    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Wolf
                </span>
                <span className="font-clash text-lg font-bold text-foreground">
                    {wolfName}
                </span>
            </div>

            <div
                role="radiogroup"
                aria-label="Wolf decision"
                className="grid grid-cols-3 gap-1.5"
            >
                <ModeButton
                    icon={<Users className="w-3.5 h-3.5" />}
                    label="Partner"
                    selected={mode === "partner"}
                    onClick={() => {
                        onModeChange("partner");
                    }}
                />
                <ModeButton
                    icon={<UserPlus className="w-3.5 h-3.5" />}
                    label="Lone"
                    selected={mode === "lone"}
                    onClick={() => {
                        onModeChange("lone");
                    }}
                />
                <ModeButton
                    icon={<Eye className="w-3.5 h-3.5" />}
                    label="Blind"
                    selected={mode === "blind"}
                    onClick={() => {
                        onModeChange("blind");
                    }}
                />
            </div>

            {mode === "partner" && (
                <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Partner
                    </p>
                    <div
                        role="radiogroup"
                        aria-label="Partner selection"
                        className="grid grid-cols-3 gap-1.5"
                    >
                        {players.map((p, i) => {
                            if (i === wolfIdx) return null;
                            const selected = partnerIdx === i;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => {
                                        onPartnerChange(i);
                                    }}
                                    className={cn(
                                        "h-9 rounded-md border text-sm font-semibold truncate px-2 transition-colors",
                                        selected
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {p.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {mode === "blind" && (
                <p className="text-xs text-muted-foreground leading-snug">
                    Blind Wolf: declared before any tee shot. Doubled stakes.
                </p>
            )}
            {mode === "lone" && (
                <p className="text-xs text-muted-foreground leading-snug">
                    Lone Wolf: passed on every partner. Wolf vs the field.
                </p>
            )}
        </div>
    );
}

function ModeButton({
    icon,
    label,
    selected,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onClick}
            className={cn(
                "flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm font-semibold transition-colors",
                selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
        >
            <span aria-hidden="true">{icon}</span>
            {label}
        </button>
    );
}

type RowProps = {
    player: WolfPlayer;
    isWolf: boolean;
    isPartner: boolean;
    value: string;
    onChange: (v: string) => void;
    onBump: (delta: number) => void;
};

function PlayerRow({
    player,
    isWolf,
    isPartner,
    value,
    onChange,
    onBump,
}: RowProps) {
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
                        {player.name}
                    </span>
                    {isWolf && (
                        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-primary">
                            Wolf
                        </span>
                    )}
                    {isPartner && (
                        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-primary">
                            Partner
                        </span>
                    )}
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
                    aria-label={`Decrease ${player.name}'s score`}
                >
                    <Minus aria-hidden="true" className="!w-5 !h-5" />
                </Button>
                <Label htmlFor={inputId} className="sr-only">
                    {player.name}&apos;s score
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
                    aria-label={`Increase ${player.name}'s score`}
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
