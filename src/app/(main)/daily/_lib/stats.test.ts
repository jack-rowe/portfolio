import { describe, expect, test } from "vitest";

import type { Game, Player, Result } from "~firebase/types";
import { addDays, addMonths, monthGrid, weekOf } from "./dates";
import {
    currentStreak,
    dayCards,
    dayTotals,
    finishedWeeks,
    crownedOn,
    lastWeekWinners,
    leaderLine,
    leadersByDay,
    pickBoardDay,
    standings,
    trendSeries,
    weeklyStandings,
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

describe("day pot", () => {
    test("a day with some games unplayed is worth the same as a full day", () => {
        const full = dayTotals(
            dayCards(
                [wordle, strands],
                [r(wordle, sam, TODAY, 2), r(wordle, alex, TODAY, 4), r(strands, sam, TODAY, 1), r(strands, alex, TODAY, 5)],
                TODAY,
            ),
        );
        // Strands only had one player, so Wordle pays out the whole day.
        const partial = dayTotals(
            dayCards([wordle, strands], [r(wordle, sam, TODAY, 2), r(wordle, alex, TODAY, 4), r(strands, jo, TODAY, 5)], TODAY),
        );
        const total = (rows: typeof full) => rows.reduce((sum, t) => sum + t.points, 0);
        expect(total(full)).toBeCloseTo(20);
        expect(total(partial)).toBeCloseTo(20);
        expect(partial.find((t) => t.player === "jo")?.points).toBe(0);
    });

    test("the all-games standings use the day pot, the per-game view doesn't", () => {
        const results = [r(wordle, sam, TODAY, 2), r(wordle, alex, TODAY, 4)];
        const input = { players, games: [wordle, strands], results, week: weekOf(TODAY), today: TODAY };
        const all = standings({ ...input, gameSlug: null });
        const one = standings({ ...input, gameSlug: "wordle" });
        expect(all.reduce((sum, x) => sum + x.points, 0)).toBeCloseTo(20);
        expect(one.reduce((sum, x) => sum + x.points, 0)).toBeCloseTo(10);
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

    test("points, wins, played, average, losses over the week", () => {
        // TODAY is a Sunday, so the two days before it belong to the previous week.
        const week = weekOf(addDays(TODAY, -1));
        const rows = standings({ players, games: [wordle], results, gameSlug: "wordle", week, today: TODAY });
        expect(rows.map((x) => x.player.slug)).toEqual(["sam", "alex"]);
        // Sam: 5 vs 2 (3.33), 4 vs X (10). Every day's pot is 10.
        expect(rows[0].points).toBeCloseTo(13.33, 2);
        expect(rows[1].points).toBeCloseTo(6.67, 2);
        expect(rows[0].ppg).toBeCloseTo(6.67, 2);
        expect(rows[0]).toMatchObject({ rank: 1, wins: 1, played: 2, losses: 0, average: 4.5 });
        expect(rows[1]).toMatchObject({ rank: 2, wins: 1, played: 2, losses: 1 });
    });

    test("only the chosen week counts; removed games drop out", () => {
        const week = weekOf(TODAY);
        const now = standings({ players, games: [wordle], results, gameSlug: null, week, today: TODAY });
        expect(now.map((x) => x.player.slug)).toEqual(["sam", "alex"]);
        expect(now[0]).toMatchObject({ wins: 1, played: 1, average: null });
        const old = standings({ players, games: [wordle], results, gameSlug: null, week: weekOf(addDays(TODAY, -40)), today: TODAY });
        expect(old[0]).toMatchObject({ wins: 1, played: 1 });
        expect(standings({ players, games: [], results, gameSlug: null, week, today: TODAY })).toEqual([]);
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

describe("weeks", () => {
    // TODAY (Oct 25, 2026) is a Sunday, so the last finished week is Oct 18 to 24.
    const lastWeek = "2026-10-18";
    const before = "2026-10-11";

    test("weeks start on Sunday", () => {
        expect(weekOf(TODAY)).toBe(TODAY);
        expect(weekOf("2026-10-24")).toBe(lastWeek);
        expect(weekOf("2026-10-01")).toBe("2026-09-27");
    });

    test("winner has the most points over the week; the current week doesn't count yet", () => {
        const results = [
            // Last week: Sam wins Monday, Alex wins Tuesday and Wednesday.
            r(wordle, sam, "2026-10-19", 2),
            r(wordle, alex, "2026-10-19", 4),
            r(wordle, sam, "2026-10-20", 5),
            r(wordle, alex, "2026-10-20", 3),
            r(wordle, sam, "2026-10-21", 5),
            r(wordle, alex, "2026-10-21", 3),
            // The week before: tied.
            r(wordle, sam, "2026-10-12", 3),
            r(wordle, alex, "2026-10-12", 3),
            // This week is still going.
            r(wordle, jo, TODAY, 1),
            r(wordle, sam, TODAY, 6),
        ];
        const weeks = finishedWeeks([wordle], results, TODAY);
        expect(weeks.map((w) => w.week)).toEqual([before, lastWeek]);
        expect(weeks[1].winners.map((t) => t.player)).toEqual(["alex"]);
        expect(weeks[0].winners.map((t) => t.player).sort()).toEqual(["alex", "sam"]);
        expect(lastWeekWinners(weeks, TODAY)).toEqual(["alex"]);
        expect(lastWeekWinners(weeks, addDays(TODAY, 7))).toEqual([]);
        // A day in a finished week crowns that week's winners; this week still shows last week's.
        expect(crownedOn(weeks, "2026-10-13", TODAY).sort()).toEqual(["alex", "sam"]);
        expect(crownedOn(weeks, TODAY, TODAY)).toEqual(["alex"]);

        const rows = weeklyStandings(players, weeks);
        expect(rows.map((x) => [x.player.slug, x.rank, x.wins, x.played])).toEqual([
            ["alex", 1, 2, 2],
            ["sam", 2, 1, 2],
        ]);
    });
});
