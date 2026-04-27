"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

type Player = {
    id: string;
    name: string;
    points: number;
};

type Props = {
    players: Player[];
    isGameOver: boolean;
    /** Title shown in the leaderboard header. Defaults to "Standings". */
    title?: string;
    /** Optional unit label after the number (e.g. "pt", "vegas"). */
    unitLabel?: (points: number) => string;
    onRename?: (playerId: string, name: string) => void;
    /** Per-player handicap to render beneath the name. */
    handicapFor?: (playerId: string) => number | undefined;
};

export function GenericLeaderboard({
    players,
    isGameOver,
    title,
    unitLabel,
    onRename,
    handicapFor,
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const rows = [...players].sort((a, b) => b.points - a.points);

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
                <h2 className="font-clash text-base font-bold tracking-wide uppercase text-muted-foreground">
                    {title ?? (isGameOver ? "Final Standings" : "Standings")}
                </h2>
            </div>
            <ul className="divide-y divide-border" aria-label="Leaderboard">
                {rows.map((p, i) => {
                    const rank =
                        rows.findIndex((x) => x.points === p.points) + 1;
                    const tied =
                        rows.filter((x) => x.points === p.points).length > 1;
                    const label = unitLabel
                        ? unitLabel(p.points)
                        : p.points === 1
                            ? "point"
                            : "points";
                    return (
                        <li
                            key={p.id}
                            className="flex items-center gap-4 px-4 py-3"
                        >
                            <span
                                aria-label={`Rank ${tied ? "tied " : ""}${String(rank)}`}
                                className={`font-clash text-2xl font-bold w-10 leading-none tabular-nums ${i === 0 ? "text-primary" : "text-muted-foreground/40"
                                    }`}
                            >
                                {tied ? "T" : ""}
                                {rank}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    {editingId === p.id ? (
                                        <input
                                            type="text"
                                            autoFocus
                                            maxLength={32}
                                            className="bg-transparent border-b border-primary/60 outline-none font-semibold text-sm w-full min-w-0 text-foreground py-0"
                                            value={editingName}
                                            onChange={(e) => {
                                                setEditingName(e.target.value);
                                            }}
                                            onBlur={() => {
                                                if (editingName.trim())
                                                    onRename?.(p.id, editingName);
                                                setEditingId(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    if (editingName.trim())
                                                        onRename?.(p.id, editingName);
                                                    setEditingId(null);
                                                } else if (e.key === "Escape") {
                                                    setEditingId(null);
                                                }
                                            }}
                                            aria-label={`Rename ${p.name}`}
                                        />
                                    ) : (
                                        <span className="font-semibold text-sm truncate">
                                            {p.name}
                                        </span>
                                    )}
                                    {!isGameOver &&
                                        onRename &&
                                        editingId !== p.id && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(p.id);
                                                    setEditingName(p.name);
                                                }}
                                                className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                                aria-label={`Rename ${p.name}`}
                                            >
                                                <Pencil
                                                    aria-hidden="true"
                                                    className="w-3 h-3"
                                                />
                                            </button>
                                        )}
                                </div>
                                {handicapFor?.(p.id) !== undefined && (
                                    <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                                        Hcp {String(handicapFor(p.id))}
                                    </div>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-clash text-xl font-bold text-foreground leading-none tabular-nums">
                                    {p.points > 0 ? "+" : ""}
                                    {p.points}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {label}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
