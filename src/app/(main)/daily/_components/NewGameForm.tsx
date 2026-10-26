"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { addGame, describeError, slugify } from "~firebase/scores";
import { SCORE_TYPES, type NewGame, type ScoreType } from "~firebase/types";
import { DEFAULT_MAX, MAX_LIMIT, SCORE_TYPE_INFO } from "../_lib/scoring";

type Props = {
    onDone: (message: string) => void;
    onCancel: () => void;
};

function hasMax(type: ScoreType): boolean {
    return type === "guesses" || type === "count";
}

/** Builds the game to save, or an error message. */
function buildGame(name: string, type: ScoreType, max: string, canFail: boolean, higherWins: boolean): NewGame | string {
    if (!name.trim()) return "Give the game a name.";
    if (!slugify(name)) return "Use at least one letter or number in the name.";
    const game: NewGame = { name: name.trim(), type };
    if (hasMax(type)) {
        const n = Number(max);
        if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) return `Max goes from 1 to ${String(MAX_LIMIT)}.`;
        game.max = n;
        game.canFail = canFail;
    }
    if (type === "points") game.higherWins = higherWins;
    return game;
}

export function NewGameForm({ onDone, onCancel }: Props) {
    const id = useId();
    const [name, setName] = useState("");
    const [type, setType] = useState<ScoreType>("guesses");
    const [max, setMax] = useState(String(DEFAULT_MAX));
    const [canFail, setCanFail] = useState(true);
    const [higherWins, setHigherWins] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const create = async (game: NewGame) => {
        setBusy(true);
        setError(null);
        try {
            await addGame(game);
            onDone(`Added ${game.name}.`);
        } catch (err) {
            setError(describeError(err, "add the game"));
        } finally {
            setBusy(false);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const built = buildGame(name, type, max, canFail, higherWins);
        if (typeof built === "string") setError(built);
        else void create(built);
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border border-border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${id}-name`}>Name</Label>
                    <Input
                        id={`${id}-name`}
                        autoComplete="off"
                        maxLength={40}
                        placeholder="Krillion"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${id}-type`}>Score type</Label>
                    <Select
                        value={type}
                        onValueChange={(v) => {
                            setType(v as ScoreType);
                        }}
                    >
                        <SelectTrigger id={`${id}-type`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SCORE_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {SCORE_TYPE_INFO[t].label}
                                    <span className="text-muted-foreground"> · {SCORE_TYPE_INFO[t].hint}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {hasMax(type) && (
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${id}-max`}>{type === "guesses" ? "Max guesses" : "Max mistakes"}</Label>
                        <Input
                            id={`${id}-max`}
                            inputMode="numeric"
                            autoComplete="off"
                            className="w-20"
                            value={max}
                            onChange={(e) => {
                                setMax(e.target.value.replaceAll(/\D/g, ""));
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                        <Checkbox
                            id={`${id}-fail`}
                            checked={canFail}
                            onCheckedChange={(v) => {
                                setCanFail(v === true);
                            }}
                        />
                        <Label htmlFor={`${id}-fail`}>
                            Can fail ({type === "guesses" ? "adds an X button" : "adds a Lost button"})
                        </Label>
                    </div>
                </div>
            )}

            {type === "points" && (
                <div role="radiogroup" aria-label="Who wins" className="flex gap-1.5">
                    {[false, true].map((high) => (
                        <Button
                            key={String(high)}
                            type="button"
                            role="radio"
                            aria-checked={higherWins === high}
                            variant={higherWins === high ? "default" : "outline"}
                            size="sm"
                            className={cn(higherWins !== high && "text-muted-foreground")}
                            onClick={() => {
                                setHigherWins(high);
                            }}
                        >
                            {high ? "Highest wins" : "Lowest wins"}
                        </Button>
                    ))}
                </div>
            )}

            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}

            <div className="flex gap-2">
                <Button type="submit" disabled={busy || !name.trim()}>
                    {busy ? "Adding…" : "Add game"}
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
