import type { Game, Player, Result } from "~firebase/types";
import { addDays, weekOf } from "./dates";
import { compareResults, dayPoints, formatNumber, lowerIsBetter } from "./scoring";

/** Only results whose game is still on the board. Removed games keep their data but drop off. */
export function liveResults(games: Game[], results: Result[]): Result[] {
    const slugs = new Set(games.map((g) => g.slug));
    return results.filter((r) => slugs.has(r.game));
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of items) {
        const k = key(item);
        const list = map.get(k);
        if (list) list.push(item);
        else map.set(k, [item]);
    }
    return map;
}

/**
 * Player slugs that won one game on one day. Ties share the win.
 * A win needs at least two players and a best result that isn't a fail.
 */
export function winnersOf(game: Game, dayResults: Result[]): string[] {
    if (dayResults.length < 2) return [];
    const ranked = [...dayResults].sort((a, b) => compareResults(game, a, b));
    const best = ranked[0];
    if (best.fail) return [];
    return ranked.filter((r) => compareResults(game, r, best) === 0).map((r) => r.player);
}

/** Today if anything was logged today, otherwise the most recent day with scores. */
export function pickBoardDay(results: Result[], today: string): string | null {
    if (results.some((r) => r.date === today)) return today;
    let latest: string | null = null;
    for (const r of results) {
        if (r.date <= today && (latest === null || r.date > latest)) latest = r.date;
    }
    return latest;
}

export type DayCard = {
    game: Game;
    /** Best to worst. */
    ranked: Result[];
    winners: string[];
    /** Player slug -> share of the pot. Empty when nobody scored. */
    points: Map<string, number>;
};

/**
 * One card per game played on `date`, in game creation order.
 *
 * Every day hands out the same total, a pot per game on the board, so a day when only
 * some games were played isn't worth less. The games that paid out split all of it.
 */
export function dayCards(games: Game[], results: Result[], date: string): DayCard[] {
    const byGame = groupBy(
        results.filter((r) => r.date === date),
        (r) => r.game,
    );
    const cards = games.flatMap((game) => {
        const dayResults = byGame.get(game.slug);
        if (!dayResults) return [];
        return [
            {
                game,
                ranked: [...dayResults].sort((a, b) => compareResults(game, a, b)),
                winners: winnersOf(game, dayResults),
                points: dayPoints(game, dayResults),
            },
        ];
    });
    const paid = cards.filter((c) => c.points.size > 0).length;
    if (paid === 0 || paid === games.length) return cards;
    const scale = games.length / paid;
    return cards.map((card) => ({
        ...card,
        points: new Map([...card.points].map(([player, n]) => [player, n * scale])),
    }));
}

function joinNames(names: string[]): string {
    if (names.length <= 1) return names.join("");
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Points rounded to what's shown, so players who look tied are tied. */
export function roundPoints(n: number): number {
    return Number(n.toFixed(1));
}

export function formatPoints(n: number): string {
    return formatNumber(n, 1);
}

export type DayTotal = {
    /** Player slug. */
    player: string;
    rank: number;
    points: number;
    wins: number;
    played: number;
};

/** Everyone who played on one day, most points first. Equal (rounded) points share a rank. */
export function dayTotals(cards: DayCard[]): DayTotal[] {
    const totals = new Map<string, Omit<DayTotal, "rank">>();
    for (const card of cards) {
        for (const r of card.ranked) {
            const row = totals.get(r.player) ?? { player: r.player, points: 0, wins: 0, played: 0 };
            row.points += card.points.get(r.player) ?? 0;
            if (card.winners.includes(r.player)) row.wins++;
            row.played++;
            totals.set(r.player, row);
        }
    }
    const rows = [...totals.values()].sort((a, b) => roundPoints(b.points) - roundPoints(a.points) || b.wins - a.wins);
    return rows.map((row) => {
        const first = rows.findIndex((o) => roundPoints(o.points) === roundPoints(row.points));
        return { ...row, rank: first + 1 };
    });
}

/** Players with the most points on one day; empty when nobody scored. */
export function dayLeaders(totals: DayTotal[]): DayTotal[] {
    if (totals.length === 0 || roundPoints(totals[0].points) === 0) return [];
    return totals.filter((t) => t.rank === 1);
}

/** "Sam leads with 6.3 pts", "Sam and Alex are tied with 5 pts each", or "No points yet". */
export function leaderLine(cards: DayCard[], nameOf: (slug: string) => string): string {
    const leaders = dayLeaders(dayTotals(cards));
    if (leaders.length === 0) return "No points yet";
    const top = formatPoints(leaders[0].points);
    const names = leaders.map((t) => nameOf(t.player));
    if (names.length === 1) return `${names[0]} leads with ${top} pts`;
    return `${joinNames(names)} are tied with ${top} pts each`;
}

/** Each day with results, mapped to that day's leaders. */
export function leadersByDay(games: Game[], results: Result[]): Map<string, DayTotal[]> {
    const byDay = new Map<string, DayTotal[]>();
    for (const [date, dayResults] of groupBy(results, (r) => r.date)) {
        byDay.set(date, dayLeaders(dayTotals(dayCards(games, dayResults, date))));
    }
    return byDay;
}

export type WeekResult = {
    /** The Sunday the week starts on. */
    week: string;
    /** Points added up across every day of the week. */
    totals: DayTotal[];
    /** Most points over the week; ties share the win. Empty when nobody scored. */
    winners: DayTotal[];
};

/** Every finished week (Sunday to Saturday, before today's week) that has results, oldest first. */
export function finishedWeeks(games: Game[], results: Result[], today: string): WeekResult[] {
    const current = weekOf(today);
    const byWeek = groupBy(
        results.filter((r) => weekOf(r.date) < current),
        (r) => weekOf(r.date),
    );
    return [...byWeek]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, weekResults]) => {
            const cards = [...groupBy(weekResults, (r) => r.date)].flatMap(([date, dayResults]) =>
                dayCards(games, dayResults, date),
            );
            const totals = dayTotals(cards);
            return { week, totals, winners: dayLeaders(totals) };
        });
}

/** Player slugs who won the week before today's. */
export function lastWeekWinners(weeks: WeekResult[], today: string): string[] {
    const last = addDays(weekOf(today), -7);
    return weeks.find((w) => w.week === last)?.winners.map((t) => t.player) ?? [];
}

/** Who wears the crown on `day`: that week's winners once it's over, otherwise last week's. */
export function crownedOn(weeks: WeekResult[], day: string, today: string): string[] {
    const week = weeks.find((w) => w.week === weekOf(day));
    return week ? week.winners.map((t) => t.player) : lastWeekWinners(weeks, today);
}

export type WeeklyRow = {
    player: Player;
    rank: number;
    /** Weeks won, shared wins included. */
    wins: number;
    /** Weeks with at least one result. */
    played: number;
    /** Most points in a single week. */
    best: number;
};

/** Players who played in any finished week, most weekly wins first. Equal wins share a rank. */
export function weeklyStandings(players: Player[], weeks: WeekResult[]): WeeklyRow[] {
    const rows = players.flatMap((player): Omit<WeeklyRow, "rank">[] => {
        const mine = weeks.flatMap((w) => w.totals.filter((t) => t.player === player.slug));
        if (mine.length === 0) return [];
        return [
            {
                player,
                wins: weeks.filter((w) => w.winners.some((t) => t.player === player.slug)).length,
                played: mine.length,
                best: Math.max(...mine.map((t) => t.points)),
            },
        ];
    });
    rows.sort(
        (a, b) =>
            b.wins - a.wins || roundPoints(b.best) - roundPoints(a.best) || a.player.name.localeCompare(b.player.name),
    );
    return rows.map((row) => ({ ...row, rank: rows.findIndex((o) => o.wins === row.wins) + 1 }));
}

export type Period = "7" | "30" | "all";

export type StandingRow = {
    player: Player;
    rank: number;
    /** Total share of the pot across every game-day played. */
    points: number;
    /** Points per result logged. */
    ppg: number;
    wins: number;
    played: number;
    losses: number;
    /** Per-game view only. For `solved` games this is the solve rate, 0 to 1. */
    average: number | null;
    /** Consecutive days played, ending today or yesterday. */
    streak: number;
};

export function periodStart(period: Period, today: string): string | null {
    if (period === "all") return null;
    return addDays(today, -(Number(period) - 1));
}

function mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Average score, or solve rate for `solved` games. */
export function averageFor(game: Game, results: Result[]): number | null {
    if (results.length === 0) return null;
    if (game.type === "solved") return results.filter((r) => !r.fail).length / results.length;
    return mean(results.map((r) => r.score));
}

/** Higher solve rate is always better; otherwise follow the game's direction. */
function averageIsBetterLow(game: Game): boolean {
    return game.type !== "solved" && lowerIsBetter(game);
}

/** Consecutive days with at least one result, counting back from today (or yesterday if today is empty). */
export function currentStreak(dates: Set<string>, today: string): number {
    let day = dates.has(today) ? today : addDays(today, -1);
    let streak = 0;
    while (dates.has(day)) {
        streak++;
        day = addDays(day, -1);
    }
    return streak;
}

type StandingsInput = {
    players: Player[];
    games: Game[];
    results: Result[];
    /** null = all games */
    gameSlug: string | null;
    period: Period;
    today: string;
};

/** Players who played in the period, most points first. */
export function standings({ players, games, results, gameSlug, period, today }: StandingsInput): StandingRow[] {
    const game = gameSlug ? games.find((g) => g.slug === gameSlug) : undefined;
    if (gameSlug && !game) return [];
    const scoped = liveResults(game ? [game] : games, results).filter((r) => r.date <= today);
    const start = periodStart(period, today);
    const inPeriod = start ? scoped.filter((r) => r.date >= start) : scoped;

    const wins = new Map<string, number>();
    const points = new Map<string, number>();
    // The per-game view uses that game's own pot; across all games, each day is worth the same.
    for (const [date, dayResults] of groupBy(inPeriod, (r) => r.date)) {
        for (const card of dayCards(game ? [game] : games, dayResults, date)) {
            for (const p of card.winners) wins.set(p, (wins.get(p) ?? 0) + 1);
            for (const [p, n] of card.points) points.set(p, (points.get(p) ?? 0) + n);
        }
    }

    const periodByPlayer = groupBy(inPeriod, (r) => r.player);
    // Streaks look at all loaded history, not just the period, so a 40-day streak still reads 40.
    const allByPlayer = groupBy(scoped, (r) => r.player);

    const rows = players.flatMap((player): Omit<StandingRow, "rank">[] => {
        const mine = periodByPlayer.get(player.slug);
        if (!mine) return [];
        const total = points.get(player.slug) ?? 0;
        return [
            {
                player,
                points: total,
                ppg: total / mine.length,
                wins: wins.get(player.slug) ?? 0,
                played: mine.length,
                losses: mine.filter((r) => r.fail).length,
                average: game ? averageFor(game, mine) : null,
                streak: currentStreak(new Set((allByPlayer.get(player.slug) ?? []).map((r) => r.date)), today),
            },
        ];
    });

    const compareAvg = (a: number | null, b: number | null): number => {
        if (!game || a === null || b === null) return 0;
        return averageIsBetterLow(game) ? a - b : b - a;
    };
    const comparePoints = (a: number, b: number): number => roundPoints(b) - roundPoints(a);
    rows.sort(
        (a, b) =>
            comparePoints(a.points, b.points) ||
            b.wins - a.wins ||
            compareAvg(a.average, b.average) ||
            b.played - a.played ||
            a.player.name.localeCompare(b.player.name),
    );

    // Competition ranking: equal points and wins (and equal average in the per-game view) share a rank.
    return rows.map((row, i) => {
        let rank = i + 1;
        for (let j = i - 1; j >= 0; j--) {
            const prev = rows[j];
            if (
                comparePoints(prev.points, row.points) !== 0 ||
                prev.wins !== row.wins ||
                compareAvg(prev.average, row.average) !== 0
            ) {
                break;
            }
            rank = j + 1;
        }
        return { ...row, rank };
    });
}

export type TrendPoint = { date: string } & Record<string, number | string | null>;

/**
 * One point per day for the last `days` days. Each player's value is their
 * rolling average over the trailing `window` days, or null if they didn't play then.
 */
export function trendSeries(
    game: Game,
    players: Player[],
    results: Result[],
    today: string,
    days = 30,
    window = 7,
): TrendPoint[] {
    const byPlayer = groupBy(
        results.filter((r) => r.game === game.slug),
        (r) => r.player,
    );
    const points: TrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = addDays(today, -i);
        const from = addDays(date, -(window - 1));
        const point: TrendPoint = { date };
        for (const player of players) {
            const inWindow = (byPlayer.get(player.slug) ?? []).filter((r) => r.date >= from && r.date <= date);
            point[player.slug] = averageFor(game, inWindow);
        }
        points.push(point);
    }
    return points;
}

/** Whether better values sit at the bottom of the raw scale (so the chart axis should flip). */
export function trendLowerIsBetter(game: Game): boolean {
    return averageIsBetterLow(game);
}
