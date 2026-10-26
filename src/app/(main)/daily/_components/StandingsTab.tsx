"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Game, Player, Result } from "~firebase/types";
import { formatAverage } from "../_lib/scoring";
import { standings, type Period } from "../_lib/stats";
import { PlayerIcon } from "./PlayerIconButton";

const ALL = "all";

const PERIODS: { value: Period; label: string }[] = [
    { value: "7", label: "7 days" },
    { value: "30", label: "30 days" },
    { value: "all", label: "All time" },
];

type Props = {
    players: Player[];
    games: Game[];
    results: Result[];
    today: string;
};

export function StandingsTab({ players, games, results, today }: Props) {
    const [gameSlug, setGameSlug] = useState<string>(ALL);
    const [period, setPeriod] = useState<Period>("30");

    // Fall back to All if the chosen game was removed.
    const game = games.find((g) => g.slug === gameSlug) ?? null;
    const rows = standings({ players, games, results, gameSlug: game?.slug ?? null, period, today });
    const showLosses = rows.some((r) => r.losses > 0);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
                <Select value={game ? game.slug : ALL} onValueChange={setGameSlug}>
                    <SelectTrigger className="w-44" aria-label="Game">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All games</SelectItem>
                        {games.map((g) => (
                            <SelectItem key={g.slug} value={g.slug}>
                                {g.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={period}
                    onValueChange={(v) => {
                        setPeriod(v as Period);
                    }}
                >
                    <SelectTrigger className="w-32" aria-label="Period">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PERIODS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                                {p.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {rows.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Nobody has played in this period.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8 text-right">#</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">Wins</TableHead>
                            <TableHead className="text-right">Played</TableHead>
                            {game && (
                                <TableHead className="text-right">{game.type === "solved" ? "Solve %" : "Avg"}</TableHead>
                            )}
                            {showLosses && <TableHead className="text-right">Losses</TableHead>}
                            <TableHead className="text-right">Streak</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="tabular-nums">
                        {rows.map((row) => (
                            <TableRow key={row.player.slug}>
                                <TableCell className="text-right text-muted-foreground">{row.rank}</TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-2 font-medium">
                                        <PlayerIcon player={row.player} />
                                        <span className="truncate">{row.player.name}</span>
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-clash text-base font-bold">{row.wins}</TableCell>
                                <TableCell className="text-right">{row.played}</TableCell>
                                {game && (
                                    <TableCell className="text-right">
                                        {row.average === null ? "–" : formatAverage(game, row.average)}
                                    </TableCell>
                                )}
                                {showLosses && <TableCell className="text-right">{row.losses}</TableCell>}
                                <TableCell className="text-right">{row.streak > 0 ? `${String(row.streak)}d` : "–"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
