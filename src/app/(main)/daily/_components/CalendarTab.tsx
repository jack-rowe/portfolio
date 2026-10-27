"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Game, Player, Result } from "~firebase/types";
import { addMonths, formatDay, formatMonth, monthGrid, monthOf, parseDateKey } from "../_lib/dates";
import { formatPoints, leadersByDay, pickBoardDay } from "../_lib/stats";
import { DayView } from "./DayView";
import { PlayerIcon } from "./PlayerIconButton";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
    players: Player[];
    games: Game[];
    /** Already limited to games on the board. */
    results: Result[];
    today: string;
};

export function CalendarTab({ players, games, results, today }: Props) {
    const [selected, setSelected] = useState<string | null>(() => pickBoardDay(results, today));
    const [month, setMonth] = useState(() => monthOf(selected ?? today));

    const byPlayer = new Map(players.map((p) => [p.slug, p]));
    const leaders = leadersByDay(games, results);
    const firstMonth = results.reduce((min, r) => (monthOf(r.date) < min ? monthOf(r.date) : min), monthOf(today));
    const lastMonth = monthOf(today);
    // Fall back to nothing selected if that day's results were deleted.
    const day = selected && leaders.has(selected) ? selected : null;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Previous month"
                        disabled={month <= firstMonth}
                        onClick={() => {
                            setMonth(addMonths(month, -1));
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="font-clash text-lg font-bold">{formatMonth(month)}</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Next month"
                        disabled={month >= lastMonth}
                        onClick={() => {
                            setMonth(addMonths(month, 1));
                        }}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground" aria-hidden>
                    {WEEKDAYS.map((d, i) => (
                        <span key={i}>{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {monthGrid(month).map((key, i) => {
                        if (!key) return <span key={`blank-${String(i)}`} />;
                        const dayLeaders = leaders.get(key);
                        const isSelected = key === day;
                        const top = dayLeaders?.[0];
                        const leaderNames = dayLeaders?.map((t) => byPlayer.get(t.player)?.name ?? t.player);
                        return (
                            <button
                                key={key}
                                type="button"
                                disabled={!dayLeaders}
                                aria-pressed={isSelected}
                                aria-label={
                                    formatDay(key) +
                                    (leaderNames?.length && top
                                        ? `, ${leaderNames.join(" and ")} led with ${formatPoints(top.points)} pts`
                                        : "")
                                }
                                onClick={() => {
                                    setSelected(key);
                                }}
                                className={cn(
                                    "flex h-16 flex-col items-center justify-between rounded-md border p-1 text-xs transition-colors",
                                    dayLeaders
                                        ? "border-border bg-card hover:bg-accent"
                                        : "border-transparent text-muted-foreground/60",
                                    key === today && "border-primary",
                                    isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                                )}
                            >
                                <span className="self-start tabular-nums leading-none">
                                    {parseDateKey(key).getDate()}
                                </span>
                                {dayLeaders && dayLeaders.length > 0 && top && (
                                    <span className="flex flex-col items-center gap-0.5">
                                        <span className="flex -space-x-2">
                                            {dayLeaders.slice(0, 2).map((t) => (
                                                <PlayerIcon
                                                    key={t.player}
                                                    player={byPlayer.get(t.player) ?? { slug: t.player, name: t.player }}
                                                />
                                            ))}
                                        </span>
                                        <span className="font-clash font-bold tabular-nums leading-none">
                                            {formatPoints(top.points)}
                                        </span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {day ? (
                <DayView players={players} games={games} results={results} day={day} note={formatDay(day)} />
            ) : (
                <p className="py-8 text-center text-muted-foreground">
                    {leaders.size === 0 ? "No scores yet." : "Pick a day to see its standings."}
                </p>
            )}
        </div>
    );
}
