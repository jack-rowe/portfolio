"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { loadLastNames } from "../_lib/storage";
import {
    DEFAULT_PLAYER_COUNT,
    MAX_PLAYERS,
    MIN_PLAYERS,
} from "../_lib/types";

type Props = {
    onStart: (names: string[]) => void;
};

const PLAYER_COUNT_OPTIONS = Array.from(
    { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
    (_, i) => MIN_PLAYERS + i,
);

function makeEmptyNames(): string[] {
    return Array.from({ length: MAX_PLAYERS }, () => "");
}

function findDuplicates(names: string[]): Set<string> {
    const seen = new Map<string, number>();
    const dupes = new Set<string>();
    for (const raw of names) {
        const key = raw.trim().toLowerCase();
        if (!key) continue;
        const count = (seen.get(key) ?? 0) + 1;
        seen.set(key, count);
        if (count > 1) dupes.add(key);
    }
    return dupes;
}

export function Setup({ onStart }: Props) {
    const [playerCount, setPlayerCount] =
        useState<number>(DEFAULT_PLAYER_COUNT);
    const [names, setNames] = useState<string[]>(makeEmptyNames);
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const baseId = useId();

    // Hydrate prefilled names from last round.
    useEffect(() => {
        const last = loadLastNames();
        if (!last) return;
        setPlayerCount(last.count);
        setNames(() => {
            const next = makeEmptyNames();
            for (let i = 0; i < last.names.length && i < MAX_PLAYERS; i++) {
                next[i] = last.names[i];
            }
            return next;
        });
    }, []);

    const visibleNames = names.slice(0, playerCount);
    const duplicates = useMemo(
        () => findDuplicates(visibleNames),
        [visibleNames],
    );
    const hasDuplicates = duplicates.size > 0;

    const submit = () => {
        onStart(names.slice(0, playerCount));
    };

    const focusRow = (i: number) => {
        // Defer to allow rerender if count just grew.
        requestAnimationFrame(() => {
            inputsRef.current[i]?.focus();
            inputsRef.current[i]?.select();
        });
    };

    const moveRow = (from: number, to: number) => {
        if (from === to) return;
        if (from < 0 || to < 0) return;
        if (from >= MAX_PLAYERS || to >= MAX_PLAYERS) return;
        setNames((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    const addRow = () => {
        if (playerCount >= MAX_PLAYERS) return;
        const nextCount = playerCount + 1;
        setPlayerCount(nextCount);
        focusRow(nextCount - 1);
    };

    const handleEnter = (i: number) => {
        if (i + 1 < playerCount) {
            focusRow(i + 1);
            return;
        }
        if (playerCount < MAX_PLAYERS) {
            addRow();
            return;
        }
        submit();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-lg space-y-8">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-2">
                        Golf Game
                    </p>
                    <h1 className="font-clash text-6xl md:text-7xl font-bold text-foreground leading-none">
                        GAUNTLET
                    </h1>
                    <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">
                        Beat your target on a hole and advance to the next player. Work all
                        the way around and score a point.
                    </p>
                </div>

                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                        Players
                    </p>
                    <div
                        role="radiogroup"
                        aria-label="Number of players"
                        className="inline-flex rounded-md border border-border bg-card p-1"
                    >
                        {PLAYER_COUNT_OPTIONS.map((count) => {
                            const selected = count === playerCount;
                            return (
                                <button
                                    key={count}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => {
                                        setPlayerCount(count);
                                    }}
                                    className={cn(
                                        "font-clash text-base font-bold px-4 h-9 rounded-sm transition-colors",
                                        selected
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {count}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-3">
                    {visibleNames.map((n, i) => {
                        const id = `${baseId}-name-${String(i)}`;
                        const trimmed = n.trim().toLowerCase();
                        const isDup = trimmed !== "" && duplicates.has(trimmed);
                        const isDragOver =
                            dragOverIdx === i &&
                            dragIdx !== null &&
                            dragIdx !== i;
                        return (
                            <div
                                key={id}
                                draggable
                                onDragStart={(e) => {
                                    setDragIdx(i);
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData("text/plain", String(i));
                                }}
                                onDragOver={(e) => {
                                    if (dragIdx === null) return;
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                    setDragOverIdx(i);
                                }}
                                onDragLeave={() => {
                                    setDragOverIdx((prev) =>
                                        prev === i ? null : prev,
                                    );
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (dragIdx === null) return;
                                    moveRow(dragIdx, i);
                                    setDragIdx(null);
                                    setDragOverIdx(null);
                                }}
                                onDragEnd={() => {
                                    setDragIdx(null);
                                    setDragOverIdx(null);
                                }}
                                className={cn(
                                    "flex items-center gap-2 rounded-md transition-colors",
                                    isDragOver &&
                                    "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                    dragIdx === i && "opacity-50",
                                )}
                            >
                                <button
                                    type="button"
                                    aria-label={`Drag to reorder player ${String(i + 1)}`}
                                    tabIndex={-1}
                                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-1"
                                >
                                    <GripVertical
                                        aria-hidden="true"
                                        className="w-4 h-4"
                                    />
                                </button>
                                <span
                                    aria-hidden="true"
                                    className="font-clash text-2xl font-bold text-primary w-6 shrink-0 leading-none text-center"
                                >
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <Label htmlFor={id} className="sr-only">
                                        Player {i + 1} name
                                    </Label>
                                    <Input
                                        id={id}
                                        ref={(el) => {
                                            inputsRef.current[i] = el;
                                        }}
                                        value={n}
                                        placeholder={`Player ${String(i + 1)}`}
                                        autoComplete="off"
                                        aria-invalid={isDup || undefined}
                                        className={cn(
                                            "h-12 text-base bg-card border-border focus-visible:ring-primary",
                                            isDup &&
                                            "border-amber-500/60 focus-visible:ring-amber-500",
                                        )}
                                        onChange={(e) => {
                                            const next = [...names];
                                            next[i] = e.target.value;
                                            setNames(next);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleEnter(i);
                                                return;
                                            }
                                            if (
                                                (e.altKey || e.metaKey) &&
                                                e.key === "ArrowUp"
                                            ) {
                                                e.preventDefault();
                                                if (i > 0) {
                                                    moveRow(i, i - 1);
                                                    focusRow(i - 1);
                                                }
                                                return;
                                            }
                                            if (
                                                (e.altKey || e.metaKey) &&
                                                e.key === "ArrowDown"
                                            ) {
                                                e.preventDefault();
                                                if (i + 1 < playerCount) {
                                                    moveRow(i, i + 1);
                                                    focusRow(i + 1);
                                                }
                                                return;
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        type="button"
                                        aria-label={`Move player ${String(i + 1)} up`}
                                        disabled={i === 0}
                                        onClick={() => {
                                            moveRow(i, i - 1);
                                            focusRow(i - 1);
                                        }}
                                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground p-0.5"
                                    >
                                        <ChevronUp
                                            aria-hidden="true"
                                            className="w-3.5 h-3.5"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`Move player ${String(i + 1)} down`}
                                        disabled={i + 1 >= playerCount}
                                        onClick={() => {
                                            moveRow(i, i + 1);
                                            focusRow(i + 1);
                                        }}
                                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground p-0.5"
                                    >
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="w-3.5 h-3.5"
                                        />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {playerCount < MAX_PLAYERS && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={addRow}
                            className="w-full h-10 text-sm text-muted-foreground hover:text-foreground gap-1.5"
                        >
                            <Plus aria-hidden="true" className="w-4 h-4" />
                            Add player
                        </Button>
                    )}

                    {hasDuplicates && (
                        <p
                            role="alert"
                            className="text-xs text-amber-500 leading-relaxed"
                        >
                            Two players share a name. You can still start, but the
                            scorecard will be hard to read.
                        </p>
                    )}
                </div>

                <Button
                    className="w-full h-12 text-base font-semibold tracking-wide"
                    onClick={submit}
                >
                    Start Game
                </Button>
            </div>
        </div>
    );
}
