import { describe, expect, test } from "vitest";

import type { Game, Player, Result } from "~firebase/types";
import { addDays, addMonths, monthGrid } from "./dates";
import {
    currentStreak,
    dayCards,
    dayTotals,
    leaderLine,
    leadersByDay,
    pickBoardDay,
    standings,
    trendSeries,
} from "./stats";

const TODAY = "2026-10-25";

const wordle: Game = { slug: "wordle", name: "Wordle", type: "guesses", max: 6, canFail: true, createdAt: 1 };
const strands: Game = { slug: "strands", name: "Strands", type: "points", higherWins: true, createdAt: 2 };

const sam: Player = { slug: "sam", name: "Sam", createdAt: 1 };
const alex: Player = { slug: "alex", name: "Alex", createdAt: 2 };
const jo: Player = { slug: "jo", name: "Jo", createdAt: 3 };
const players = [sam, alex, jo];

function r(game: Game, player: Player, date: string, score: number, fail = false): Result {
    return {
        id: `${game.slug}-${date}-${player.slug}`,
        game: game.slug,
        gameName: game.name,
        player: player.slug,
        date,
        score,
        fail,
        shown: String(score),
        createdAt: 0,
    };
}

const names = (slug: string) => players.find((p) => p.slug === slug)?.name ?? slug;

describe("today board", () => {
    test("falls back to the most recent day with scores", () => {
        const yesterday = addDays(TODAY, -1);
        expect(pickBoardDay([r(wordle, sam, yesterday, 3)], TODAY)).toBe(yesterday);
        expect(pickBoardDay([r(wordle, sam, TODAY, 3)], TODAY)).toBe(TODAY);
        expect(pickBoardDay([], TODAY)).toBeNull();
    });

    test("ranks best to worst, shares ties, respects higherWins", () => {
        const results = [
            r(wordle, sam, TODAY, 3),
            r(wordle, alex, TODAY, 3),
            r(wordle, jo, TODAY, 7, true),
            r(strands, sam, TODAY, 10),
            r(strands, alex, TODAY, 20),
        ];
        const cards = dayCards([wordle, strands], results, TODAY);
        expect(cards.map((c) => c.game.slug)).toEqual(["wordle", "strands"]);
        expect(cards[0].winners.sort()).toEqual(["alex", "sam"]);
        expect(cards[0].ranked.at(-1)?.player).toBe("jo");
        expect(cards[1].winners).toEqual(["alex"]);
        expect(leaderLine(cards, names)).toBe("Alex leads with 11.7 pts");
    });

    test("no winner when only one person played or everyone failed", () => {
        const cards = dayCards(
            [wordle],
            [r(wordle, sam, TODAY, 7, true), r(wordle, alex, TODAY, 7, true)],
            TODAY,
        );
        expect(cards[0].winners).toEqual([]);
        expect(dayCards([wordle], [r(wordle, sam, TODAY, 2)], TODAY)[0].winners).toEqual([]);
        expect(cards[0].points.size).toBe(0);
        expect(leaderLine(cards, names)).toBe("No points yet");
    });

    test("tie line", () => {
        const cards = dayCards(
            [wordle, strands],
            [r(wordle, sam, TODAY, 2), r(wordle, alex, TODAY, 4), r(strands, sam, TODAY, 1), r(strands, alex, TODAY, 5)],
            TODAY,
        );
        expect(leaderLine(cards, names)).toBe("Sam and Alex are tied with 10 pts each");
    });
});

describe("standings", () => {
    const results = [
        r(wordle, sam, TODAY, 3),
        r(wordle, alex, TODAY, 4),
        r(wordle, sam, addDays(TODAY, -1), 5),
        r(wordle, alex, addDays(TODAY, -1), 2),
        r(wordle, alex, addDays(TODAY, -2), 7, true),
        r(wordle, sam, addDays(TODAY, -2), 4),
        r(wordle, sam, addDays(TODAY, -40), 1),
        r(wordle, alex, addDays(TODAY, -40), 6),
    ];

    test("points, wins, played, average, losses over the period", () => {
        const rows = standings({ players, games: [wordle], results, gameSlug: "wordle", period: "7", today: TODAY });
        expect(rows.map((x) => x.player.slug)).toEqual(["sam", "alex"]);
        // Sam: 3 vs 4 (5.71), 5 vs 2 (3.33), 4 vs X (10). Every day's pot is 10.
        expect(rows[0].points).toBeCloseTo(19.05, 2);
        expect(rows[1].points).toBeCloseTo(10.95, 2);
        expect(rows[0].ppg).toBeCloseTo(6.35, 2);
        expect(rows[0]).toMatchObject({ rank: 1, wins: 2, played: 3, losses: 0, average: 4 });
        expect(rows[1]).toMatchObject({ rank: 2, wins: 1, played: 3, losses: 1 });
    });

    test("all time includes older days; removed games drop out", () => {
        const all = standings({ players, games: [wordle], results, gameSlug: null, period: "all", today: TODAY });
        expect(all[0]).toMatchObject({ wins: 3, played: 4, average: null });
        expect(standings({ players, games: [], results, gameSlug: null, period: "all", today: TODAY })).toEqual([]);
    });

    test("streak counts back from today or yesterday", () => {
        const days = new Set([addDays(TODAY, -1), addDays(TODAY, -2), addDays(TODAY, -4)]);
        expect(currentStreak(days, TODAY)).toBe(2);
        expect(currentStreak(new Set([addDays(TODAY, -2)]), TODAY)).toBe(0);
    });
});

describe("trendSeries", () => {
    test("7-day rolling average per player, null when no plays", () => {
        const series = trendSeries(
            wordle,
            [sam, jo],
            [r(wordle, sam, TODAY, 3), r(wordle, sam, addDays(TODAY, -6), 5), r(wordle, sam, addDays(TODAY, -7), 1)],
            TODAY,
        );
        expect(series).toHaveLength(30);
        expect(series.at(-1)).toEqual({ date: TODAY, sam: 4, jo: null });
        expect(series.at(-2)?.sam).toBe(3);
    });
});

describe("calendar", () => {
    test("day totals add points across games and share ranks", () => {
        const cards = dayCards(
            [wordle, strands],
            [r(wordle, sam, TODAY, 2), r(wordle, alex, TODAY, 4), r(strands, sam, TODAY, 1), r(strands, alex, TODAY, 5), r(strands, jo, TODAY, 5)],
            TODAY,
        );
        const totals = dayTotals(cards);
        expect(totals.map((t) => [t.player, t.rank, t.played])).toEqual([
            ["sam", 1, 2],
            ["alex", 2, 2],
            ["jo", 3, 1],
        ]);
        expect(totals.reduce((sum, t) => sum + t.points, 0)).toBeCloseTo(20);
    });

    test("leaders by day; a solo day has results but no leader", () => {
        const yesterday = addDays(TODAY, -1);
        const byDay = leadersByDay(
            [wordle],
            [r(wordle, sam, TODAY, 2), r(wordle, alex, TODAY, 4), r(wordle, jo, yesterday, 3)],
        );
        expect(byDay.get(TODAY)?.map((t) => t.player)).toEqual(["sam"]);
        expect(byDay.get(yesterday)).toEqual([]);
        expect(byDay.has(addDays(TODAY, -2))).toBe(false);
    });

    test("month grid starts on Sunday and months roll over years", () => {
        // October 1, 2026 is a Thursday.
        const grid = monthGrid("2026-10");
        expect(grid.slice(0, 5)).toEqual([null, null, null, null, "2026-10-01"]);
        expect(grid.at(-1)).toBe("2026-10-31");
        expect(addMonths("2026-01", -1)).toBe("2025-12");
        expect(addMonths("2026-12", 1)).toBe("2027-01");
    });
});
