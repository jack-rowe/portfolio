"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Game, Player, Result } from "~firebase/types";
import {
    addMonths,
    formatDay,
    formatMonth,
    formatShortDay,
    monthGrid,
    monthOf,
    parseDateKey,
    weekOf,
} from "../_lib/dates";
import { crownedOn, formatPoints, leadersByDay, pickBoardDay, type WeekResult } from "../_lib/stats";
import { ChampionsContext } from "./champions";
import { DayView } from "./DayView";
import { PlayerIcon } from "./PlayerIconButton";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Seven day columns, then a narrow one for the week's winner. */
const GRID = "grid grid-cols-[repeat(7,minmax(0,1fr))_2rem] gap-1";

type Props = {
    players: Player[];
    games: Game[];
    /** Already limited to games on the board. */
    results: Result[];
    today: string;
    weeks: WeekResult[];
};

export function CalendarTab({ players, games, results, today, weeks }: Props) {
    const [selected, setSelected] = useState<string | null>(() => pickBoardDay(results, today));
    const [month, setMonth] = useState(() => monthOf(selected ?? today));

    const byPlayer = new Map(players.map((p) => [p.slug, p]));
    const leaders = leadersByDay(games, results);
    const weekWinners = new Map(weeks.map((w) => [w.week, w.winners]));
    const cells = monthGrid(month);
    const rows = Array.from({ length: Math.ceil(cells.length / 7) }, (_, i) => cells.slice(i * 7, i * 7 + 7));
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

                <div className={cn(GRID, "text-center text-xs text-muted-foreground")} aria-hidden>
                    {WEEKDAYS.map((d, i) => (
                        <span key={i}>{d}</span>
                    ))}
                    <span>Wk</span>
                </div>
                <div className={GRID}>
                    {rows.map((row, r) => {
                        const first = row.find((key) => key !== null);
                        const week = first ? weekOf(first) : null;
                        return (
                            <Fragment key={week ?? r}>
                                {row.map((key, i) => {
                                    if (!key) return <span key={`blank-${String(i)}`} />;
                                    const dayLeaders = leaders.get(key);
                                    const isSelected = key === day;
                                    const top = dayLeaders?.[0];
                                    const leaderNames = dayLeaders?.map(
                                        (t) => byPlayer.get(t.player)?.name ?? t.player,
                                    );
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
                                                                player={
                                                                    byPlayer.get(t.player) ?? {
                                                                        slug: t.player,
                                                                        name: t.player,
                                                                    }
                                                                }
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
                                <WeekWinner
                                    week={week}
                                    winners={week ? weekWinners.get(week) : undefined}
                                    byPlayer={byPlayer}
                                />
                            </Fragment>
                        );
                    })}
                </div>
            </div>

            {day ? (
                <DayOfWeek players={players} games={games} results={results} day={day} today={today} weeks={weeks} />
            ) : (
                <p className="py-8 text-center text-muted-foreground">
                    {leaders.size === 0 ? "No scores yet." : "Pick a day to see its standings."}
                </p>
            )}
        </div>
    );
}

type WeekWinnerProps = {
    week: string | null;
    winners: WeekResult["winners"] | undefined;
    byPlayer: Map<string, Player>;
};

/** The winner(s) at the end of a calendar row, ringed in gold, once the week is over. */
function WeekWinner({ week, winners, byPlayer }: WeekWinnerProps) {
    if (!week || !winners || winners.length === 0) return <span />;
    const names = winners.map((t) => byPlayer.get(t.player)?.name ?? t.player);
    const label = `Week of ${formatShortDay(week)}: ${names.join(" and ")} won with ${formatPoints(winners[0].points)} pts`;
    return (
        <span title={label} className="flex h-16 flex-col items-center justify-center gap-1 pt-2">
            <span className="sr-only">{label}</span>
            <span aria-hidden className="flex flex-col items-center -space-y-2">
                {winners.slice(0, 2).map((t) => (
                    <PlayerIcon
                        key={t.player}
                        player={byPlayer.get(t.player) ?? { slug: t.player, name: t.player }}
                        badge="gold"
                    />
                ))}
            </span>
            <span aria-hidden className="font-clash text-[0.65rem] font-bold tabular-nums leading-none">
                {formatPoints(winners[0].points)}
            </span>
        </span>
    );
}

/** A picked day, crowning whoever won its week (or last week's winner while the week is still going). */
function DayOfWeek({ weeks, today, ...props }: Props & { day: string }) {
    const crowned = crownedOn(weeks, props.day, today);
    const finished = weeks.some((w) => w.week === weekOf(props.day));
    const names = crowned.map((slug) => props.players.find((p) => p.slug === slug)?.name ?? slug);
    const note =
        finished && names.length > 0
            ? `${formatDay(props.day)} · ${names.join(" and ")} won the week`
            : formatDay(props.day);

    return (
        <ChampionsContext.Provider value={new Set(crowned)}>
            <DayView {...props} note={note} />
        </ChampionsContext.Provider>
    );
}
