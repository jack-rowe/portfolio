import type { Game, Result } from "~firebase/types";
import { addDays } from "./dates";
import { compareResults } from "./scoring";
import { dayCards, dayLeaders, dayTotals, groupBy, roundPoints, type DayCard, type WeekResult } from "./stats";

/** One player's claim on a record. `date` is when it happened, or the last day it grew. */
export type Feat = {
    /** Player slug. */
    player: string;
    date: string;
    value: number;
    /** Game slug, for records set in one game. */
    game?: string;
    /** How many played, for records that are easier with fewer players. */
    players?: number;
    /** How many games counted toward a day rating. */
    games?: number;
    /** Where a run started; `date` is where it ended. */
    from?: string;
    /** Every day counted, for tallies. */
    dates?: string[];
};

/** A record's value and everyone who holds it, earliest first. */
export type Top = { value: number; holders: Feat[] };

/** Negative when `a` is the better feat; 0 means they tie for the record. */
type Compare = (a: Feat, b: Feat) => number;

const most =
    (round: (n: number) => number = (n) => n): Compare =>
    (a, b) =>
        round(b.value) - round(a.value);

export function top(feats: Feat[], compare: Compare): Top | null {
    if (feats.length === 0) return null;
    const best = feats.reduce((a, b) => (compare(b, a) < 0 ? b : a));
    const holders = feats.filter((f) => compare(f, best) === 0).sort((a, b) => a.date.localeCompare(b.date));
    return { value: holders[0].value, holders };
}

function mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** How many times each player did something, dated by the last time. */
function tally(events: { player: string; date: string }[]): Feat[] {
    const counts = new Map<string, Feat>();
    for (const e of events) {
        const feat = counts.get(e.player) ?? { player: e.player, date: e.date, value: 0, dates: [] };
        feat.value++;
        feat.dates?.push(e.date);
        if (e.date > feat.date) feat.date = e.date;
        counts.set(e.player, feat);
    }
    return [...counts.values()];
}

/**
 * Each player's longest run of consecutive steps they appear in, from the step it started on to the one it ended on.
 * A step without them breaks their run.
 */
export function longestRuns(steps: { date: string; who: Iterable<string> }[]): Feat[] {
    const running = new Map<string, { n: number; from: string }>();
    const best = new Map<string, Feat>();
    for (const step of steps) {
        const who = new Set(step.who);
        for (const player of [...running.keys()]) if (!who.has(player)) running.delete(player);
        for (const player of who) {
            const prev = running.get(player);
            const run = { n: (prev?.n ?? 0) + 1, from: prev?.from ?? step.date };
            running.set(player, run);
            if (run.n > (best.get(player)?.value ?? 0)) {
                best.set(player, { player, date: step.date, value: run.n, from: run.from });
            }
        }
    }
    return [...best.values()];
}

/**
 * Each result's percentile within its game's whole history, from 0 (worst) to 100 (best), by result id.
 * This puts every game on one scale. Ties share the midpoint, fails are 0, and a game's only result is 50.
 */
export function percentiles(games: Game[], results: Result[]): Map<string, number> {
    const out = new Map<string, number>();
    const byGame = groupBy(results, (r) => r.game);
    for (const game of games) {
        const ranked = [...(byGame.get(game.slug) ?? [])].sort((a, b) => compareResults(game, a, b));
        const n = ranked.length;
        for (let i = 0; i < n; ) {
            let j = i;
            while (j < n && compareResults(game, ranked[j], ranked[i]) === 0) j++;
            // ranked[i..j) tie with each other; everything after j is worse.
            const pct = n === 1 ? 50 : (100 * (n - j + (j - i - 1) / 2)) / (n - 1);
            for (let k = i; k < j; k++) out.set(ranked[k].id, ranked[k].fail ? 0 : pct);
            i = j;
        }
    }
    return out;
}

/**
 * Each player's average percentile on each day they played every game anyone logged that day.
 * A day needs at least two games, unless the board only has one.
 */
export function dayRatings(games: Game[], results: Result[]): Feat[] {
    const pct = percentiles(games, results);
    const need = Math.min(2, games.length);
    return [...groupBy(results, (r) => r.date)].flatMap(([date, dayResults]) => {
        const played = new Set(dayResults.map((r) => r.game)).size;
        if (played < need) return [];
        return [...groupBy(dayResults, (r) => r.player)].flatMap(([player, mine]) =>
            mine.length < played
                ? []
                : [{ player, date, value: mean(mine.map((r) => pct.get(r.id) ?? 0)), games: played }],
        );
    });
}

export type RatingPart = {
    game: Game;
    result: Result;
    pct: number;
    /** 1 for the best result ever logged in this game. Ties share a rank. */
    rank: number;
    /** Results ever logged in this game. */
    of: number;
};

/** The games behind one player's day rating, each with its percentile and all-time rank. */
export function ratingParts(games: Game[], results: Result[], player: string, date: string): RatingPart[] {
    const pct = percentiles(games, results);
    return games.flatMap((game) => {
        const history = results.filter((r) => r.game === game.slug);
        const result = history.find((r) => r.player === player && r.date === date);
        if (!result) return [];
        const better = history.filter((o) => compareResults(game, o, result) < 0).length;
        return [{ game, result, pct: pct.get(result.id) ?? 0, rank: better + 1, of: history.length }];
    });
}

/** The best (or worst) result ever in a game: who got there first, and every time it's been matched. */
export type ResultMark = {
    /** The first time it happened. */
    result: Result;
    /** Every result equal to it, first one first. */
    tied: Result[];
};

function resultMark(game: Game, results: Result[], worst: boolean): ResultMark | null {
    if (results.length === 0) return null;
    const better = (a: Result, b: Result) => (worst ? compareResults(game, b, a) : compareResults(game, a, b));
    const record = results.reduce((a, b) => (better(b, a) < 0 ? b : a));
    const tied = results
        .filter((r) => compareResults(game, r, record) === 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    return { result: tied[0], tied };
}

export type GameRecords = {
    game: Game;
    /** Null for `solved` games, where there's no best or worst, just solved or missed. */
    best: ResultMark | null;
    worst: ResultMark | null;
    /** `solved` games only: most solves in a row, across the days each player played. */
    solveStreak: Top | null;
};

type Day = { date: string; cards: DayCard[] };

function gameRecords(game: Game, results: Result[]): GameRecords {
    const mine = results.filter((r) => r.game === game.slug);
    const solved = game.type === "solved";
    const solveRuns = solved
        ? [...groupBy(mine, (r) => r.player)].flatMap(([player, played]) =>
              longestRuns(
                  [...played]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((r) => ({ date: r.date, who: r.fail ? [] : [player] })),
              ).map((f) => ({ ...f, game: game.slug })),
          )
        : [];

    return {
        game,
        best: solved ? null : resultMark(game, mine, false),
        worst: solved ? null : resultMark(game, mine, true),
        solveStreak: top(solveRuns, most()),
    };
}

export type HallOfFame = {
    /** Pot points in one day. Easier with fewer players, so each holder carries `players`. */
    mostPoints: Top | null;
    /** Highest day rating (average percentile, 0 to 100). */
    bestDay: Top | null;
    /** Biggest share of one game's pot (0 to 1). Ties go to the game with more players. */
    blowout: Top | null;
    /** Days a player won every game that had a winner, with at least two of them. */
    sweeps: Top | null;
    /** Most calendar days in a row with a result. */
    playStreak: Top | null;
    /** Most days in a row leading the day. Days nobody scored are skipped. */
    leadStreak: Top | null;
    /** Most weeks in a row won. */
    crownRun: Top | null;
    games: GameRecords[];
};

/** Every record on the board. `results` should already be limited to games on the board. */
export function hallOfFame(games: Game[], allResults: Result[], weeks: WeekResult[], today: string): HallOfFame {
    const results = allResults.filter((r) => r.date <= today);
    const days: Day[] = [...groupBy(results, (r) => r.date)]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dayResults]) => ({ date, cards: dayCards(games, dayResults, date) }));
    const totalsByDay = days.map(({ date, cards }) => ({ date, totals: dayTotals(cards) }));

    const mostPoints = totalsByDay.flatMap(({ date, totals }) =>
        totals.filter((t) => t.points > 0).map((t) => ({ player: t.player, date, value: t.points, players: totals.length })),
    );

    const ratings = dayRatings(games, results);

    const blowouts = days.flatMap(({ date, cards }) =>
        cards.flatMap((card) => {
            if (card.points.size < 2) return [];
            const pot = [...card.points.values()].reduce((sum, n) => sum + n, 0);
            return card.winners.map((player) => ({
                player,
                date,
                value: (card.points.get(player) ?? 0) / pot,
                game: card.game.slug,
                players: card.ranked.length,
            }));
        }),
    );
    const byShare: Compare = (a, b) =>
        Math.round(b.value * 100) - Math.round(a.value * 100) || (b.players ?? 0) - (a.players ?? 0);

    const sweeps = days.flatMap(({ date, cards }) => {
        const won = cards.filter((c) => c.winners.length > 0);
        if (won.length < 2) return [];
        return won[0].winners.filter((p) => won.every((c) => c.winners.includes(p))).map((player) => ({ player, date }));
    });

    const played = new Map(days.map(({ date, cards }) => [date, cards.flatMap((c) => c.ranked.map((r) => r.player))]));
    const calendar: { date: string; who: string[] }[] = [];
    if (days.length > 0) {
        for (let date = days[0].date; date <= today; date = addDays(date, 1)) {
            calendar.push({ date, who: played.get(date) ?? [] });
        }
    }

    const leads = totalsByDay
        .map(({ date, totals }) => ({ date, who: dayLeaders(totals).map((t) => t.player) }))
        .filter((step) => step.who.length > 0);

    const weekSteps: { date: string; who: string[] }[] = [];
    if (weeks.length > 0) {
        const winnersOf = new Map(weeks.map((w) => [w.week, w.winners.map((t) => t.player)]));
        for (let week = weeks[0].week; week <= weeks[weeks.length - 1].week; week = addDays(week, 7)) {
            weekSteps.push({ date: week, who: winnersOf.get(week) ?? [] });
        }
    }

    return {
        mostPoints: top(mostPoints, most(roundPoints)),
        bestDay: top(ratings, most(Math.round)),
        blowout: top(blowouts, byShare),
        sweeps: top(tally(sweeps), most()),
        playStreak: top(longestRuns(calendar), most()),
        leadStreak: top(longestRuns(leads), most()),
        crownRun: top(longestRuns(weekSteps), most()),
        games: games.map((game) => gameRecords(game, results)),
    };
}
