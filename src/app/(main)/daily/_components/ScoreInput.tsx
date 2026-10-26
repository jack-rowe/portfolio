"use client";

import { useId } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Game } from "~firebase/types";
import { formatGolf, GOLF_RANGE, maxFor, type Entry } from "../_lib/scoring";

type Props = {
    game: Game;
    entry: Entry | null;
    onChange: (entry: Entry) => void;
};

/** The entry control for a game's score type. */
export function ScoreInput({ game, entry, onChange }: Props) {
    switch (game.type) {
        case "guesses":
        case "count":
            return <PickInput game={game} entry={entry} onChange={onChange} />;
        case "points":
            return <PointsInput game={game} entry={entry} onChange={onChange} />;
        case "time":
            return <TimeInput entry={entry} onChange={onChange} />;
        case "golf":
            return <GolfInput entry={entry} onChange={onChange} />;
        case "solved":
            return <SolvedInput entry={entry} onChange={onChange} />;
    }
}

function ChoiceButton({
    active,
    onClick,
    children,
    ariaLabel,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    ariaLabel?: string;
}) {
    return (
        <Button
            type="button"
            variant={active ? "default" : "outline"}
            className={cn(
                "h-11 min-w-11 font-clash text-lg font-bold touch-manipulation border-border tabular-nums",
                active ? "ring-1 ring-primary" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={onClick}
            aria-pressed={active}
            aria-label={ariaLabel}
        >
            {children}
        </Button>
    );
}

function PickInput({ game, entry, onChange }: Props) {
    const max = maxFor(game);
    const first = game.type === "guesses" ? 1 : 0;
    const values = Array.from({ length: max - first + 1 }, (_, i) => first + i);
    const current = entry?.kind === "pick" ? entry.value : null;
    const failLabel = game.type === "guesses" ? "X" : "Lost";
    const unit = game.type === "guesses" ? "guesses" : "mistakes";

    return (
        <div role="group" aria-label={`${game.name} score`} className="flex flex-wrap gap-1.5">
            {values.map((n) => (
                <ChoiceButton
                    key={n}
                    active={current === n}
                    onClick={() => {
                        onChange({ kind: "pick", value: n });
                    }}
                    ariaLabel={`${String(n)} ${unit}`}
                >
                    {n}
                </ChoiceButton>
            ))}
            {game.canFail && (
                <ChoiceButton
                    active={current === "fail"}
                    onClick={() => {
                        onChange({ kind: "pick", value: "fail" });
                    }}
                    ariaLabel={game.type === "guesses" ? "Failed" : "Lost"}
                >
                    {failLabel}
                </ChoiceButton>
            )}
        </div>
    );
}

function PointsInput({ game, entry, onChange }: Props) {
    const id = useId();
    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={id}>{game.higherWins ? "Points (highest wins)" : "Points (lowest wins)"}</Label>
            <Input
                id={id}
                autoFocus
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                className="h-11 max-w-40 font-clash text-2xl font-bold tabular-nums"
                value={entry?.kind === "points" ? entry.raw : ""}
                onChange={(e) => {
                    onChange({ kind: "points", raw: e.target.value });
                }}
            />
        </div>
    );
}

function TimeInput({ entry, onChange }: Omit<Props, "game">) {
    const id = useId();
    const time = entry?.kind === "time" ? entry : { kind: "time" as const, minutes: "", seconds: "" };
    const field = "h-11 w-20 text-center font-clash text-2xl font-bold tabular-nums";

    return (
        <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-m`}>Minutes</Label>
                <Input
                    id={`${id}-m`}
                    autoFocus
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="0"
                    className={field}
                    value={time.minutes}
                    onChange={(e) => {
                        onChange({ ...time, minutes: e.target.value.replaceAll(/\D/g, "") });
                    }}
                />
            </div>
            <span aria-hidden className="pb-2 font-clash text-2xl font-bold text-muted-foreground">
                :
            </span>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-s`}>Seconds</Label>
                <Input
                    id={`${id}-s`}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="00"
                    maxLength={2}
                    className={field}
                    value={time.seconds}
                    onChange={(e) => {
                        onChange({ ...time, seconds: e.target.value.replaceAll(/\D/g, "") });
                    }}
                />
            </div>
        </div>
    );
}

function GolfInput({ entry, onChange }: Omit<Props, "game">) {
    const value = entry?.kind === "golf" ? entry.value : 0;
    const bump = (delta: number) => {
        onChange({ kind: "golf", value: Math.max(-GOLF_RANGE, Math.min(GOLF_RANGE, value + delta)) });
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 touch-manipulation border-border"
                disabled={value <= -GOLF_RANGE}
                onClick={() => {
                    bump(-1);
                }}
                aria-label="One under"
            >
                <Minus aria-hidden="true" className="!w-5 !h-5" />
            </Button>
            <output
                aria-live="polite"
                className={cn(
                    "flex h-11 w-20 items-center justify-center rounded-md border font-clash text-2xl font-bold tabular-nums",
                    value === 0 ? "border-border text-foreground" : "border-primary text-primary bg-primary/5",
                )}
            >
                {formatGolf(value)}
            </output>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 touch-manipulation border-border"
                disabled={value >= GOLF_RANGE}
                onClick={() => {
                    bump(1);
                }}
                aria-label="One over"
            >
                <Plus aria-hidden="true" className="!w-5 !h-5" />
            </Button>
        </div>
    );
}

function SolvedInput({ entry, onChange }: Omit<Props, "game">) {
    const solved = entry?.kind === "solved" ? entry.solved : null;
    return (
        <div role="group" aria-label="Result" className="flex gap-1.5">
            <ChoiceButton
                active={solved === true}
                onClick={() => {
                    onChange({ kind: "solved", solved: true });
                }}
            >
                Solved
            </ChoiceButton>
            <ChoiceButton
                active={solved === false}
                onClick={() => {
                    onChange({ kind: "solved", solved: false });
                }}
            >
                Missed
            </ChoiceButton>
        </div>
    );
}
