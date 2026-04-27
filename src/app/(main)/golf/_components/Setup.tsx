"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { COURSES } from "../_lib/courseData";
import {
    MAX_HANDICAP,
    buildHandicapConfig,
} from "../_lib/handicap";
import type { HandicapConfig, HandicapMode } from "../_lib/handicap";
import { loadLastMode, loadLastNames } from "../_lib/storage";
import {
    DEFAULT_GAME_MODE,
    DEFAULT_PLAYER_COUNT,
    MAX_PLAYERS,
    MIN_PLAYERS,
} from "../_lib/types";
import type { GameMode } from "../_lib/types";
import { LCR_PLAYER_COUNT } from "../_lib/lcr/types";
import {
    MATCHPLAY_MAX_PLAYERS,
    MATCHPLAY_MIN_PLAYERS,
} from "../_lib/matchplay/types";
import {
    STROKEPLAY_MAX_PLAYERS,
    STROKEPLAY_MIN_PLAYERS,
} from "../_lib/strokeplay/types";
import {
    STABLEFORD_MAX_PLAYERS,
    STABLEFORD_MIN_PLAYERS,
} from "../_lib/stableford/types";
import {
    SCRAMBLE_PLAYER_COUNT,
} from "../_lib/scramble/types";
import type {
    ScrambleFormat,
    ScrambleLayout,
} from "../_lib/scramble/types";
import { WOLF_PLAYER_COUNT } from "../_lib/wolf/types";

type PlayerBounds = { min: number; max: number; fixed: number | null };

function playerBounds(mode: GameMode): PlayerBounds {
    if (mode === "wolf" || mode === "vegas" || mode === "hollywood") {
        return { min: WOLF_PLAYER_COUNT, max: WOLF_PLAYER_COUNT, fixed: WOLF_PLAYER_COUNT };
    }
    if (mode === "lcr") {
        return { min: LCR_PLAYER_COUNT, max: LCR_PLAYER_COUNT, fixed: LCR_PLAYER_COUNT };
    }
    if (mode === "matchplay") {
        return { min: MATCHPLAY_MIN_PLAYERS, max: MATCHPLAY_MAX_PLAYERS, fixed: null };
    }
    if (mode === "strokeplay") {
        return { min: STROKEPLAY_MIN_PLAYERS, max: STROKEPLAY_MAX_PLAYERS, fixed: null };
    }
    if (mode === "stableford") {
        return { min: STABLEFORD_MIN_PLAYERS, max: STABLEFORD_MAX_PLAYERS, fixed: null };
    }
    if (mode === "scramble") {
        return { min: SCRAMBLE_PLAYER_COUNT, max: SCRAMBLE_PLAYER_COUNT, fixed: SCRAMBLE_PLAYER_COUNT };
    }
    // gauntlet: 3-4
    return { min: 3, max: MAX_PLAYERS, fixed: null };
}

function computeLockMessage(
    label: string,
    bounds: PlayerBounds,
): string | null {
    if (bounds.fixed !== null) {
        return `${label} is played with exactly ${String(bounds.fixed)} players.`;
    }
    return `${label} supports ${String(bounds.min)} to ${String(bounds.max)} players.`;
}

type StartOptions = {
    handicap?: HandicapConfig;
    scrambleLayout?: ScrambleLayout;
    scrambleFormat?: ScrambleFormat;
};

type Props = {
    onStart: (names: string[], mode: GameMode, opts?: StartOptions) => void;
};

type GameModeOption = {
    id: GameMode;
    label: string;
    description: string;
    available: boolean;
};

const GAME_MODES: GameModeOption[] = [
    {
        id: "gauntlet",
        label: "Gauntlet",
        description:
            "Beat your target on a hole and advance. Lap the field to score a point.",
        available: true,
    },
    {
        id: "wolf",
        label: "Wolf",
        description:
            "Rotating Wolf picks a partner or goes Lone. 4 players, 18 holes.",
        available: true,
    },
    {
        id: "vegas",
        label: "Vegas",
        description:
            "Fixed teams of 2. Two-digit team numbers; difference is the swing.",
        available: true,
    },
    {
        id: "hollywood",
        label: "6-6-6",
        description:
            "Hollywood. Best-ball match. Partners rotate every 6 holes.",
        available: true,
    },
    {
        id: "lcr",
        label: "LCR",
        description:
            "Center plays solo vs. the outside team's best ball. 3 players; pick Center each hole based on tee-shot location.",
        available: true,
    },
    {
        id: "matchplay",
        label: "Match Play",
        description:
            "Lowest score wins the hole. Halves on ties. 2-4 players.",
        available: true,
    },
    {
        id: "strokeplay",
        label: "Stroke Play",
        description:
            "Lowest net total wins. Per-player handicap subtracts from gross. 1-4 players.",
        available: true,
    },
    {
        id: "stableford",
        label: "Stableford",
        description:
            "Points per hole based on net score vs par. Course required. 1-4 players.",
        available: true,
    },
    {
        id: "scramble",
        label: "Scramble",
        description:
            "Best ball per team each hole. 2v2 or 4v0. Match play or stroke play.",
        available: true,
    },
];

const PLAYER_COUNT_OPTIONS = Array.from(
    { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
    (_, i) => MIN_PLAYERS + i,
);

function makeEmptyNames(): string[] {
    return Array.from({ length: MAX_PLAYERS }, () => "");
}

function makeEmptyHandicaps(): string[] {
    return Array.from({ length: MAX_PLAYERS }, () => "");
}

function clampHandicapInput(raw: string): string {
    const digits = raw.replaceAll(/\D/g, "");
    if (digits === "") return "";
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n) || n < 0) return "0";
    if (n > MAX_HANDICAP) return String(MAX_HANDICAP);
    return String(n);
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
    const [mode, setMode] = useState<GameMode>(DEFAULT_GAME_MODE);
    const [playerCount, setPlayerCount] =
        useState<number>(DEFAULT_PLAYER_COUNT);
    const [names, setNames] = useState<string[]>(makeEmptyNames);
    const [handicaps, setHandicaps] = useState<string[]>(makeEmptyHandicaps);
    const [scrambleLayout, setScrambleLayout] =
        useState<ScrambleLayout>("2v2");
    const [scrambleFormat, setScrambleFormat] =
        useState<ScrambleFormat>("matchplay");
    const [courseId, setCourseId] = useState<string | null>(null);
    const [handicapMode, setHandicapMode] = useState<HandicapMode>("none");
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const baseId = useId();

    // Hydrate prefilled names + last mode.
    useEffect(() => {
        const lastMode = loadLastMode();
        if (lastMode) setMode(lastMode);
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

    // Coerce playerCount into the bounds for the selected mode.
    useEffect(() => {
        const b = playerBounds(mode);
        if (b.fixed !== null && playerCount !== b.fixed) {
            setPlayerCount(b.fixed);
        } else if (playerCount < b.min) {
            setPlayerCount(b.min);
        } else if (playerCount > b.max) {
            setPlayerCount(b.max);
        }
    }, [mode, playerCount]);

    // "strokes" mode requires a course (for stroke index data).
    // "gross" mode (whole-round deduction) only applies to strokeplay.
    useEffect(() => {
        if (handicapMode === "gross" && mode !== "strokeplay") {
            setHandicapMode("none");
            return;
        }
        if (handicapMode === "strokes" && courseId === null) {
            setHandicapMode(mode === "strokeplay" ? "gross" : "none");
        }
    }, [handicapMode, courseId, mode]);

    const visibleNames = names.slice(0, playerCount);
    const duplicates = useMemo(
        () => findDuplicates(visibleNames),
        [visibleNames],
    );
    const hasDuplicates = duplicates.size > 0;
    const selectedMode =
        GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0];
    const bounds = playerBounds(mode);
    const lockMessage = computeLockMessage(selectedMode.label, bounds);
    const needsCourse = mode === "stableford" && courseId === null;
    const canStart = selectedMode.available && !needsCourse;

    const submit = () => {
        if (!canStart) return;
        const trimmedNames = names.slice(0, playerCount);
        const hcps = handicaps
            .slice(0, playerCount)
            .map((h) => {
                const n = Number.parseInt(h, 10);
                return Number.isFinite(n) && n >= 0 ? n : 0;
            });
        let handicapCfg: HandicapConfig | undefined;
        if (mode === "stableford") {
            // Stableford always needs the course id, even with handicapMode === "none".
            handicapCfg = {
                mode: handicapMode,
                courseId: courseId ?? undefined,
                handicaps: hcps,
            };
        } else if (handicapMode !== "none") {
            handicapCfg = buildHandicapConfig(
                handicapMode,
                courseId ?? undefined,
                hcps,
            );
        } else {
            handicapCfg = undefined;
        }
        if (mode === "scramble") {
            const fmt: ScrambleFormat =
                scrambleLayout === "4v0" ? "strokeplay" : scrambleFormat;
            onStart(trimmedNames, mode, {
                scrambleLayout,
                scrambleFormat: fmt,
            });
            return;
        }
        onStart(trimmedNames, mode, { handicap: handicapCfg });
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
        setHandicaps((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    const addRow = () => {
        if (playerCount >= bounds.max) return;
        const nextCount = playerCount + 1;
        setPlayerCount(nextCount);
        focusRow(nextCount - 1);
    };

    const handleEnter = (i: number) => {
        if (i + 1 < playerCount) {
            focusRow(i + 1);
            return;
        }
        if (playerCount < bounds.max) {
            addRow();
            return;
        }
        submit();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start px-6 py-12">
            <div className="w-full max-w-lg space-y-8">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                        Game
                    </p>
                    <div
                        role="radiogroup"
                        aria-label="Game mode"
                        className="grid grid-cols-2 gap-2"
                    >
                        {GAME_MODES.map((opt) => {
                            const selected = opt.id === mode;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => {
                                        setMode(opt.id);
                                    }}
                                    className={cn(
                                        "text-left rounded-md border px-3 py-2.5 transition-colors",
                                        selected
                                            ? "border-primary bg-primary/5"
                                            : "border-border bg-card hover:border-foreground/40",
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-clash text-base font-bold">
                                            {opt.label}
                                        </span>
                                        {!opt.available && (
                                            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                                                Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-snug mt-1">
                                        {opt.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
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
                            const disabled =
                                count < bounds.min || count > bounds.max;
                            return (
                                <button
                                    key={count}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    disabled={disabled}
                                    onClick={() => {
                                        if (!disabled) setPlayerCount(count);
                                    }}
                                    className={cn(
                                        "font-clash text-base font-bold px-4 h-9 rounded-sm transition-colors",
                                        selected
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                        disabled &&
                                        "opacity-30 cursor-not-allowed hover:text-muted-foreground",
                                    )}
                                >
                                    {count}
                                </button>
                            );
                        })}
                    </div>
                    {lockMessage !== null && (
                        <p className="text-xs text-muted-foreground">
                            {lockMessage}
                        </p>
                    )}
                </div>

                {mode !== "scramble" && (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                Course
                            </p>
                            <div
                                role="radiogroup"
                                aria-label="Course"
                                className="grid grid-cols-2 gap-2"
                            >
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={courseId === null}
                                    onClick={() => {
                                        setCourseId(null);
                                    }}
                                    className={cn(
                                        "text-left rounded-md border px-3 py-2.5 transition-colors",
                                        courseId === null
                                            ? "border-primary bg-primary/5"
                                            : "border-border bg-card hover:border-foreground/40",
                                    )}
                                >
                                    <span className="font-clash text-base font-bold block">
                                        None
                                    </span>
                                    <span className="text-xs text-muted-foreground leading-snug">
                                        No par or stroke index
                                    </span>
                                </button>
                                {COURSES.map((c) => {
                                    const selected = courseId === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => {
                                                setCourseId(c.id);
                                            }}
                                            className={cn(
                                                "text-left rounded-md border px-3 py-2.5 transition-colors",
                                                selected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border bg-card hover:border-foreground/40",
                                            )}
                                        >
                                            <span className="font-clash text-base font-bold block">
                                                {c.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground leading-snug">
                                                Par {c.holes.reduce((s, h) => s + h.par, 0)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                Handicap
                            </p>
                            <div
                                role="radiogroup"
                                aria-label="Handicap mode"
                                className={cn(
                                    "grid gap-2",
                                    mode === "strokeplay"
                                        ? "grid-cols-3"
                                        : "grid-cols-2",
                                )}
                            >
                                {(
                                    [
                                        {
                                            id: "none" as HandicapMode,
                                            label: "None",
                                            desc: "Gross only",
                                        },
                                        ...(mode === "strokeplay"
                                            ? [
                                                {
                                                    id: "gross" as HandicapMode,
                                                    label: "Gross",
                                                    desc: "Subtract from total",
                                                },
                                            ]
                                            : []),
                                        {
                                            id: "strokes" as HandicapMode,
                                            label: "Strokes",
                                            desc: "Per-hole by index",
                                        },
                                    ]
                                ).map((opt) => {
                                    const disabled =
                                        opt.id === "strokes" && courseId === null;
                                    const selected = handicapMode === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            disabled={disabled}
                                            onClick={() => {
                                                if (!disabled) setHandicapMode(opt.id);
                                            }}
                                            className={cn(
                                                "text-left rounded-md border px-3 py-2.5 transition-colors",
                                                selected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border bg-card hover:border-foreground/40",
                                                disabled &&
                                                "opacity-40 cursor-not-allowed hover:border-border",
                                            )}
                                        >
                                            <span className="font-clash text-base font-bold block">
                                                {opt.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground leading-snug">
                                                {opt.desc}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {handicapMode === "strokes" && courseId === null && (
                                <p className="text-xs text-muted-foreground">
                                    Select a course to use stroke-by-hole handicapping.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {mode === "scramble" && (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                Layout
                            </p>
                            <div
                                role="radiogroup"
                                aria-label="Scramble layout"
                                className="grid grid-cols-2 gap-2"
                            >
                                {(
                                    [
                                        {
                                            id: "2v2" as ScrambleLayout,
                                            label: "2 vs 2",
                                            desc: "Two teams of 2",
                                        },
                                        {
                                            id: "4v0" as ScrambleLayout,
                                            label: "4 vs 0",
                                            desc: "All four on one team",
                                        },
                                    ]
                                ).map((opt) => {
                                    const selected = scrambleLayout === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => {
                                                setScrambleLayout(opt.id);
                                            }}
                                            className={cn(
                                                "text-left rounded-md border px-3 py-2.5 transition-colors",
                                                selected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border bg-card hover:border-foreground/40",
                                            )}
                                        >
                                            <span className="font-clash text-base font-bold block">
                                                {opt.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground leading-snug">
                                                {opt.desc}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {scrambleLayout === "2v2" && (
                                <p className="text-xs text-muted-foreground">
                                    Players 1 &amp; 2 form Team A; 3 &amp; 4 form Team B. Drag or tap arrows to rearrange.
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                Format
                            </p>
                            <div
                                role="radiogroup"
                                aria-label="Scramble format"
                                className="grid grid-cols-2 gap-2"
                            >
                                {(
                                    [
                                        {
                                            id: "matchplay" as ScrambleFormat,
                                            label: "Match",
                                            desc: "Lowest team score wins the hole",
                                        },
                                        {
                                            id: "strokeplay" as ScrambleFormat,
                                            label: "Stroke",
                                            desc: "Lowest team total wins",
                                        },
                                    ]
                                ).map((opt) => {
                                    const disabled =
                                        scrambleLayout === "4v0" &&
                                        opt.id === "matchplay";
                                    const effective: ScrambleFormat =
                                        scrambleLayout === "4v0"
                                            ? "strokeplay"
                                            : scrambleFormat;
                                    const selected = effective === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            disabled={disabled}
                                            onClick={() => {
                                                if (!disabled)
                                                    setScrambleFormat(opt.id);
                                            }}
                                            className={cn(
                                                "text-left rounded-md border px-3 py-2.5 transition-colors",
                                                selected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border bg-card hover:border-foreground/40",
                                                disabled &&
                                                "opacity-40 cursor-not-allowed hover:border-border",
                                            )}
                                        >
                                            <span className="font-clash text-base font-bold block">
                                                {opt.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground leading-snug">
                                                {opt.desc}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {scrambleLayout === "4v0" && (
                                <p className="text-xs text-muted-foreground">
                                    4v0 uses stroke play (no opposing team).
                                </p>
                            )}
                        </div>
                    </div>
                )}

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
                                {handicapMode !== "none" && (
                                    <div className="w-16 shrink-0">
                                        <Label
                                            htmlFor={`${id}-hcp`}
                                            className="sr-only"
                                        >
                                            Player {i + 1} handicap
                                        </Label>
                                        <Input
                                            id={`${id}-hcp`}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            autoComplete="off"
                                            placeholder="Hcp"
                                            value={handicaps[i] ?? ""}
                                            className="h-12 text-base text-center font-clash font-bold tabular-nums bg-card border-border focus-visible:ring-primary"
                                            onChange={(e) => {
                                                const next = [...handicaps];
                                                next[i] = clampHandicapInput(
                                                    e.target.value,
                                                );
                                                setHandicaps(next);
                                            }}
                                        />
                                    </div>
                                )}
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

                    {playerCount < bounds.max && (
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
                    disabled={!canStart}
                >
                    {`Start ${selectedMode.label}`}
                </Button>
            </div>
        </div>
    );
}
