"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { splitFor } from "../../_lib/strokeplay/engine";
import type {
    StrokeplayHole,
    StrokeplayPlayer,
} from "../../_lib/strokeplay/types";

type Props = {
    players: StrokeplayPlayer[];
    holes: StrokeplayHole[];
    isGameOver: boolean;
    onRename?: (playerId: string, name: string) => void;
};

export function Leaderboard({ players, holes, isGameOver, onRename }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const rows = players
        .map((p, i) => ({ player: p, split: splitFor(p, i, holes) }))
        .sort((a, b) => a.split.net - b.split.net);

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
                <h2 className="font-clash text-base font-bold tracking-wide uppercase text-muted-foreground">
                    {isGameOver ? "Final Standings" : "Standings"}
                </h2>
            </div>
            <ul className="divide-y divide-border" aria-label="Leaderboard">
                {rows.map(({ player: p, split }, i) => {
                    const rank =
                        rows.findIndex((x) => x.split.net === split.net) + 1;
                    const tied =
                        rows.filter((x) => x.split.net === split.net).length >
                        1;
                    return (
                        <li
                            key={p.id}
                            className="flex items-center gap-4 px-4 py-3"
                        >
                            <span
                                aria-label={`Rank ${tied ? "tied " : ""}${String(rank)}`}
                                className={cn(
                                    "font-clash text-2xl font-bold w-10 leading-none tabular-nums",
                                    i === 0
                                        ? "text-primary"
                                        : "text-muted-foreground/40",
                                )}
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
                                                    onRename?.(
                                                        p.id,
                                                        editingName,
                                                    );
                                                setEditingId(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    if (editingName.trim())
                                                        onRename?.(
                                                            p.id,
                                                            editingName,
                                                        );
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
                                <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                                    Gross {split.total} · Hcp {p.handicap}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-clash text-xl font-bold text-foreground leading-none tabular-nums">
                                    {split.net}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    net
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
