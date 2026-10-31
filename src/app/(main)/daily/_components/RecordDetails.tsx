import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Game, Player, Result } from "~firebase/types";
import { addDays, formatDay, formatShortDay, formatWeek } from "../_lib/dates";
import { ratingParts, type Feat, type ResultMark, type Top } from "../_lib/records";
import { formatNumber, POT } from "../_lib/scoring";
import { dayCards, dayTotals, formatPoints, type WeekResult } from "../_lib/stats";
import { DayView } from "./DayView";
import { GameIcon } from "./GameIconButton";
import { PlayerIcon } from "./PlayerIconButton";

export type PlayerOf = (slug: string) => Pick<Player, "slug" | "name">;

/** Everything a detail view needs to recompute how a record came about. */
export type RecordContext = {
    players: Player[];
    games: Game[];
    /** Already limited to games on the board and days up to today. */
    results: Result[];
    weeks: WeekResult[];
    playerOf: PlayerOf;
};

export const ABOUT = {
    bestDay:
        "Each score is ranked against every result ever logged for that game and turned into a percentile: 100 is the best ever, 0 the worst. Fails count as 0 and ties share the middle. The day's rating is the average across its games, and only counts if the player played every game logged that day.",
    mostPoints: `Every game hands out a ${String(POT)}-point pot each day. Everyone who finishes gets one share, plus up to one more for each player they beat (a full share for beating them by double, or beating a fail). Fewer players means fewer ways to split it.`,
    blowout:
        "The winner's share of one game's pot. Crushing everyone, or beating players who failed, takes most of it. Ties go to the game with more players.",
    sweeps: "Days winning every game that had a winner, with at least two games played.",
    playStreak: "Calendar days in a row with at least one score logged.",
    leadStreak: "Days in a row finishing with the most points. Days nobody scored are skipped.",
    crownRun: "Finished weeks in a row with the most points, Sunday to Saturday.",
    mark: "The first player to post this score holds the record. Later equal scores count as matches.",
    solveStreak: "Solves in a row, across the days the player played.",
};

type DialogProps = {
    title: string;
    about: string;
    /** The tile's face. Null details leave it as a plain, unclickable tile. */
    face: React.ReactNode;
    className?: string;
    children: React.ReactNode | null;
};

/** A record tile that opens to show how it was set. */
export function RecordDialog({ title, about, face, className, children }: DialogProps) {
    if (!children) return <div className={className}>{face}</div>;
    return (
        <Dialog>
            <DialogTrigger
                className={cn(
                    "group relative text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    className,
                )}
            >
                {face}
                <ChevronRight
                    aria-hidden
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100"
                />
            </DialogTrigger>
            {/* The dialog is a grid, so children need min-w-0 to shrink below their content width. */}
            <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto overflow-x-hidden rounded-lg p-4 sm:p-6 [&>*]:min-w-0">
                <DialogHeader className="text-left">
                    <DialogTitle className="pr-6 font-clash text-xl">{title}</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">{about}</DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

export type DetailProps = { ctx: RecordContext; f: Feat };

/** One block per holder, so ties each show their own working. */
export function PerHolder({ top, ctx, Detail }: { top: Top; ctx: RecordContext; Detail: React.ComponentType<DetailProps> }) {
    return (
        <div className="flex flex-col divide-y divide-border">
            {top.holders.map((f) => {
                const player = ctx.playerOf(f.player);
                return (
                    <section key={`${f.player}-${f.date}`} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                        <h4 className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
                            <PlayerIcon player={player} size="sm" badge="champion" />
                            {player.name}
                            {f.from && f.from !== f.date ? (
                                <span className="text-sm font-normal text-muted-foreground">
                                    {formatShortDay(f.from)} – {formatShortDay(f.date)}
                                </span>
                            ) : (
                                <span className="text-sm font-normal text-muted-foreground">{formatDay(f.date)}</span>
                            )}
                        </h4>
                        <Detail ctx={ctx} f={f} />
                    </section>
                );
            })}
        </div>
    );
}

/** First column takes the slack and truncates; the rest hug their numbers. */
const cell = (i: number) => (i === 0 ? "w-full max-w-0 text-left" : "whitespace-nowrap pl-3 text-right");

/** A small label-and-value table for showing working. Scrolls sideways rather than overflowing the dialog. */
function Working({ head, rows, total }: { head: string[]; rows: React.ReactNode[][]; total?: React.ReactNode[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs tabular-nums sm:text-sm">
                <thead>
                    <tr className="text-xs text-muted-foreground">
                        {head.map((h, i) => (
                            <th key={h} className={cn("pb-1 font-medium", cell(i))}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((cells, r) => (
                        <tr key={r} className="border-t border-border">
                            {cells.map((c, i) => (
                                <td key={i} className={cn("py-1.5", cell(i))}>
                                    {i === 0 ? <span className="block truncate">{c}</span> : c}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                {total && (
                    <tfoot>
                        <tr className="border-t-2 border-border font-semibold">
                            {total.map((c, i) => (
                                <td key={i} className={cn("pt-1.5", cell(i))}>
                                    {c}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

function GameName({ game }: { game: Game }) {
    return (
        <span className="flex min-w-0 items-center gap-2">
            <GameIcon game={game} size="xs" />
            <span className="truncate">{game.name}</span>
        </span>
    );
}

function Standings({ ctx, games, day }: { ctx: RecordContext; games: Game[]; day: string }) {
    return (
        <details className="group min-w-0 rounded-lg border border-border p-2 sm:p-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center gap-1 text-sm font-medium">
                <ChevronRight aria-hidden className="h-4 w-4 transition-transform group-open:rotate-90" />
                Standings that day
            </summary>
            <div className="pt-3">
                <DayView players={ctx.players} games={games} results={ctx.results} day={day} />
            </div>
        </details>
    );
}

export function BestDayDetail({ ctx, f }: DetailProps) {
    const parts = ratingParts(ctx.games, ctx.results, f.player, f.date);
    return (
        <>
            <Working
                head={["Game", "Score", "Rank", "Pctl"]}
                rows={parts.map((p) => [
                    <GameName key="g" game={p.game} />,
                    p.result.shown,
                    `${String(p.rank)}/${String(p.of)}`,
                    formatNumber(p.pct, 1),
                ])}
                total={["Average", "", "", `${String(Math.round(f.value))}/100`]}
            />
            <p className="break-words text-xs text-muted-foreground">
                Rank is all-time in that game. ({parts.map((p) => formatNumber(p.pct, 1)).join(" + ")}) ÷ {parts.length} = {formatNumber(f.value, 1)}
            </p>
            <Standings ctx={ctx} games={ctx.games} day={f.date} />
        </>
    );
}

export function MostPointsDetail({ ctx, f }: DetailProps) {
    const cards = dayCards(ctx.games, ctx.results, f.date).filter((c) => c.ranked.some((r) => r.player === f.player));
    return (
        <>
            <Working
                head={["Game", "Score", "Players", "Points"]}
                rows={cards.map((c) => [
                    <GameName key="g" game={c.game} />,
                    c.ranked.find((r) => r.player === f.player)?.shown,
                    c.ranked.length,
                    formatPoints(c.points.get(f.player) ?? 0),
                ])}
                total={["Total", "", "", `${formatPoints(f.value)} pts`]}
            />
            <Standings ctx={ctx} games={ctx.games} day={f.date} />
        </>
    );
}

export function BlowoutDetail({ ctx, f }: DetailProps) {
    const card = dayCards(ctx.games, ctx.results, f.date).find((c) => c.game.slug === f.game);
    if (!card) return null;
    const pot = [...card.points.values()].reduce((sum, n) => sum + n, 0);
    return (
        <>
            <Working
                head={["Player", "Score", "Points", "Share"]}
                rows={card.ranked.map((r) => {
                    const pts = card.points.get(r.player) ?? 0;
                    return [
                        ctx.playerOf(r.player).name,
                        r.shown,
                        formatPoints(pts),
                        `${String(Math.round((100 * pts) / pot))}%`,
                    ];
                })}
                total={[card.game.name, "", formatPoints(pot), "100%"]}
            />
            <Standings ctx={ctx} games={[card.game]} day={f.date} />
        </>
    );
}

export function SweepsDetail({ ctx, f }: DetailProps) {
    const dates = [...(f.dates ?? [])].sort().reverse();
    return (
        <Working
            head={["Day", "Games won"]}
            rows={dates.map((date) => {
                const won = dayCards(ctx.games, ctx.results, date).filter((c) => c.winners.includes(f.player));
                return [
                    formatDay(date),
                    <span key="w" className="inline-flex flex-wrap justify-end gap-1">
                        {won.map((c) => (
                            <GameIcon key={c.game.slug} game={c.game} size="xs" />
                        ))}
                    </span>,
                ];
            })}
        />
    );
}

/** Every calendar day from `from` to `to`. */
function daysBetween(from: string, to: string): string[] {
    const days: string[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
    return days;
}

export function PlayStreakDetail({ ctx, f }: DetailProps) {
    const mine = ctx.results.filter((r) => r.player === f.player);
    return (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-1.5">
            {daysBetween(f.from ?? f.date, f.date).map((date) => {
                const n = mine.filter((r) => r.date === date).length;
                return (
                    <li key={date} className="flex flex-col rounded-md bg-muted/60 px-2 py-1 text-xs">
                        <span className="font-medium">{formatShortDay(date)}</span>
                        <span className="text-muted-foreground">
                            {n} game{n === 1 ? "" : "s"}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

export function LeadStreakDetail({ ctx, f }: DetailProps) {
    const days = [...new Set(ctx.results.map((r) => r.date))]
        .filter((d) => d >= (f.from ?? f.date) && d <= f.date)
        .sort()
        .flatMap((date) => {
            const totals = dayTotals(dayCards(ctx.games, ctx.results, date));
            const mine = totals.find((t) => t.player === f.player);
            if (!mine || mine.points === 0) return [];
            const next = totals.find((t) => t.player !== f.player);
            return [{ date, points: mine.points, next }];
        });
    return (
        <Working
            head={["Day", "Points", "Runner-up"]}
            rows={days.map((d) => [
                formatDay(d.date),
                formatPoints(d.points),
                d.next ? `${ctx.playerOf(d.next.player).name} ${formatPoints(d.next.points)}` : "–",
            ])}
        />
    );
}

export function CrownRunDetail({ ctx, f }: DetailProps) {
    const weeks = ctx.weeks.filter((w) => w.week >= (f.from ?? f.date) && w.week <= f.date);
    return (
        <Working
            head={["Week", "Points", "Runner-up"]}
            rows={weeks.map((w) => {
                const mine = w.totals.find((t) => t.player === f.player);
                const next = w.totals.find((t) => t.player !== f.player);
                return [
                    formatWeek(w.week),
                    formatPoints(mine?.points ?? 0),
                    next ? `${ctx.playerOf(next.player).name} ${formatPoints(next.points)}` : "–",
                ];
            })}
        />
    );
}

export function SolveStreakDetail({ ctx, f }: DetailProps) {
    const run = ctx.results
        .filter((r) => r.game === f.game && r.player === f.player && r.date >= (f.from ?? f.date) && r.date <= f.date)
        .sort((a, b) => a.date.localeCompare(b.date));
    return (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-1.5">
            {run.map((r) => (
                <li key={r.id} className="flex flex-col rounded-md bg-muted/60 px-2 py-1 text-xs">
                    <span className="font-medium">{formatShortDay(r.date)}</span>
                    <span className="text-muted-foreground">{r.shown}</span>
                </li>
            ))}
        </ul>
    );
}

export function MarkDetail({ ctx, game, mark }: { ctx: RecordContext; game: Game; mark: ResultMark }) {
    const first = ctx.playerOf(mark.result.player);
    const matches = mark.tied.slice(1);
    return (
        <div className="flex flex-col gap-4">
            <p className="flex items-start gap-2 text-sm">
                <PlayerIcon player={first} size="sm" badge="champion" />
                <span>
                    <span className="font-medium">{first.name}</span> first posted{" "}
                    <span className="font-semibold">{mark.result.shown}</span> on {formatDay(mark.result.date)}.
                </span>
            </p>
            <DayView players={ctx.players} games={[game]} results={ctx.results} day={mark.result.date} />
            {matches.length > 0 && (
                <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-medium">Matched {matches.length} time{matches.length === 1 ? "" : "s"} since</h4>
                    <Working
                        head={["Player", "Day"]}
                        rows={[...matches].reverse().map((r) => [ctx.playerOf(r.player).name, formatDay(r.date)])}
                    />
                </div>
            )}
        </div>
    );
}
