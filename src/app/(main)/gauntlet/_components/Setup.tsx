"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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

export function Setup({ onStart }: Props) {
    const [playerCount, setPlayerCount] =
        useState<number>(DEFAULT_PLAYER_COUNT);
    const [names, setNames] = useState<string[]>(() =>
        Array.from({ length: MAX_PLAYERS }, () => ""),
    );
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const baseId = useId();

    const submit = () => {
        onStart(names.slice(0, playerCount));
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
                    {names.slice(0, playerCount).map((n, i) => {
                        const id = `${baseId}-name-${String(i)}`;
                        return (
                            <div key={id} className="flex items-center gap-3">
                                <span
                                    aria-hidden="true"
                                    className="font-clash text-2xl font-bold text-primary w-6 shrink-0 leading-none"
                                >
                                    {i + 1}
                                </span>
                                <div className="flex-1">
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
                                        className="h-12 text-base bg-card border-border focus-visible:ring-primary"
                                        onChange={(e) => {
                                            const next = [...names];
                                            next[i] = e.target.value;
                                            setNames(next);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key !== "Enter") return;
                                            e.preventDefault();
                                            const nextEl =
                                                i + 1 < playerCount
                                                    ? inputsRef.current[i + 1]
                                                    : null;
                                            if (nextEl) nextEl.focus();
                                            else submit();
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
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

