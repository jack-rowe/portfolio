"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Game, Player, Result } from "~firebase/types";
import { addDays, formatWeek, weekOf } from "../_lib/dates";
import { formatAverage } from "../_lib/scoring";
import { formatPoints, standings, weeklyStandings, type WeekResult } from "../_lib/stats";
import { PlayerIcon } from "./PlayerIconButton";

const ALL = "all";

/** Sundays from the first logged week up to this one, newest first. */
function weekOptions(results: Result[], today: string): string[] {
    const current = weekOf(today);
    const first = results.reduce((min, r) => (r.date < min ? r.date : min), today);
    const options: string[] = [];
    for (let week = current; week >= weekOf(first); week = addDays(week, -7)) options.push(week);
    return options;
}

function weekLabel(week: string, current: string): string {
    if (week === current) return "This week";
    if (week === addDays(current, -7)) return "Last week";
    return formatWeek(week);
}

type Props = {
    players: Player[];
    games: Game[];
    results: Result[];
    today: string;
    weeks: WeekResult[];
};

export function StandingsTab({ players, games, results, today, weeks }: Props) {
    const [gameSlug, setGameSlug] = useState<string>(ALL);
    const current = weekOf(today);
    const [week, setWeek] = useState(current);

    const weeksBack = weekOptions(results, today);
    const firstWeek = weeksBack[weeksBack.length - 1];
    // Fall back to All if the chosen game was removed.
    const game = games.find((g) => g.slug === gameSlug) ?? null;
    const rows = standings({ players, games, results, gameSlug: game?.slug ?? null, week, today });
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
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Previous week"
                        disabled={week <= firstWeek}
                        onClick={() => {
                            setWeek(addDays(week, -7));
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Select value={week} onValueChange={setWeek}>
                        <SelectTrigger className="w-40" aria-label="Week">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {weeksBack.map((w) => (
                                <SelectItem key={w} value={w}>
                                    {weekLabel(w, current)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Next week"
                        disabled={week >= current}
                        onClick={() => {
                            setWeek(addDays(week, 7));
                        }}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {rows.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Nobody has played this week.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8 text-right">#</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">Pts</TableHead>
                            <TableHead className="text-right">Pts/game</TableHead>
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
                                        <PlayerIcon player={row.player} badge="champion" />
                                        <span className="truncate">{row.player.name}</span>
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-clash text-base font-bold">
                                    {formatPoints(row.points)}
                                </TableCell>
                                <TableCell className="text-right">{formatPoints(row.ppg)}</TableCell>
                                <TableCell className="text-right">{row.wins}</TableCell>
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

            <WeeklyTable players={players} weeks={weeks} />
        </div>
    );
}

/** Weekly wins across all games and every finished week, so the filters above don't apply. */
function WeeklyTable({ players, weeks }: { players: Player[]; weeks: WeekResult[] }) {
    const rows = weeklyStandings(players, weeks);

    return (
        <section className="flex flex-col gap-2 pt-4">
            <div>
                <h3 className="font-clash text-lg font-bold leading-tight">Weekly wins</h3>
                <p className="text-sm text-muted-foreground">
                    Most points from Sunday to Saturday, all games. Last week&apos;s winner wears the crown.
                </p>
            </div>
            {rows.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No finished weeks yet.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8 text-right">#</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">Wins</TableHead>
                            <TableHead className="text-right">Weeks</TableHead>
                            <TableHead className="text-right">Best week</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="tabular-nums">
                        {rows.map((row) => (
                            <TableRow key={row.player.slug}>
                                <TableCell className="text-right text-muted-foreground">{row.rank}</TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-2 font-medium">
                                        <PlayerIcon player={row.player} badge="champion" />
                                        <span className="truncate">{row.player.name}</span>
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-clash text-base font-bold">{row.wins}</TableCell>
                                <TableCell className="text-right">{row.played}</TableCell>
                                <TableCell className="text-right">{formatPoints(row.best)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </section>
    );
}
