import { describe, expect, test } from "vitest";

import type { Game, Player, Result } from "~firebase/types";
import { addDays } from "./dates";
import { dayRatings, hallOfFame, longestRuns, percentiles, ratingParts, top } from "./records";
import { finishedWeeks } from "./stats";

const TODAY = "2026-10-25";
const day = (n: number) => addDays(TODAY, -n);

const wordle: Game = { slug: "wordle", name: "Wordle", type: "guesses", max: 6, canFail: true, createdAt: 1 };
const strands: Game = { slug: "strands", name: "Strands", type: "points", higherWins: true, createdAt: 2 };
const connections: Game = { slug: "connections", name: "Connections", type: "solved", createdAt: 3 };
const games = [wordle, strands];

const sam: Player = { slug: "sam", name: "Sam", createdAt: 1 };
const alex: Player = { slug: "alex", name: "Alex", createdAt: 2 };
const jo: Player = { slug: "jo", name: "Jo", createdAt: 3 };

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

describe("percentiles", () => {
    test("best is 100, worst is 0, ties share the middle, fails are 0", () => {
        const results = [
            r(wordle, sam, day(0), 2),
            r(wordle, alex, day(0), 4),
            r(wordle, jo, day(0), 4),
            r(wordle, sam, day(1), 7, true),
            r(wordle, alex, day(1), 5),
        ];
        const pct = percentiles([wordle], results);
        expect(pct.get(results[0].id)).toBe(100);
        expect(pct.get(results[1].id)).toBe(62.5);
        expect(pct.get(results[2].id)).toBe(62.5);
        expect(pct.get(results[4].id)).toBe(25);
        expect(pct.get(results[3].id)).toBe(0);
    });

    test("follows higherWins and puts a lone result in the middle", () => {
        const pct = percentiles([strands], [r(strands, sam, day(0), 30), r(strands, alex, day(0), 10)]);
        expect(pct.get(`strands-${day(0)}-sam`)).toBe(100);
        expect(percentiles([wordle], [r(wordle, sam, day(0), 3)]).get(`wordle-${day(0)}-sam`)).toBe(50);
    });
});

describe("day ratings", () => {
    test("only counts players who played every game logged that day", () => {
        const results = [
            r(wordle, sam, day(0), 2),
            r(wordle, alex, day(0), 4),
            r(strands, sam, day(0), 30),
            r(strands, jo, day(0), 10),
        ];
        const ratings = dayRatings(games, results);
        expect(ratings).toEqual([{ player: "sam", date: day(0), value: 100, games: 2 }]);
    });

    test("needs two games when the board has two", () => {
        expect(dayRatings(games, [r(wordle, sam, day(0), 2), r(wordle, alex, day(0), 4)])).toEqual([]);
    });
});

describe("helpers", () => {
    test("runs break when a player misses a step", () => {
        const runs = longestRuns([
            { date: "a", who: ["sam", "alex"] },
            { date: "b", who: ["sam"] },
            { date: "c", who: ["alex"] },
            { date: "d", who: ["alex"] },
        ]);
        expect(runs).toEqual([
            { player: "sam", date: "b", value: 2, from: "a" },
            { player: "alex", date: "d", value: 2, from: "c" },
        ]);
    });

    test("ties share the record, earliest first", () => {
        const result = top(
            [
                { player: "alex", date: "b", value: 3 },
                { player: "sam", date: "a", value: 3 },
                { player: "jo", date: "c", value: 1 },
            ],
            (a, b) => b.value - a.value,
        );
        expect(result?.holders.map((h) => h.player)).toEqual(["sam", "alex"]);
    });
});

describe("hall of fame", () => {
    const results = [
        // Two days ago: Sam sweeps, Jo fails Wordle.
        r(wordle, sam, day(2), 1),
        r(wordle, alex, day(2), 4),
        r(wordle, jo, day(2), 7, true),
        r(strands, sam, day(2), 40),
        r(strands, alex, day(2), 10),
        // Yesterday: Alex wins both.
        r(wordle, sam, day(1), 5),
        r(wordle, alex, day(1), 3),
        r(strands, sam, day(1), 10),
        r(strands, alex, day(1), 20),
        // Today: Sam hits 1/6 again, Alex ties Sam's worst.
        r(wordle, sam, day(0), 1),
        r(wordle, alex, day(0), 5),
    ];
    const hof = hallOfFame(games, results, finishedWeeks(games, results, TODAY), TODAY);

    test("per-game best and worst credit whoever got there first", () => {
        const w = hof.games.find((g) => g.game.slug === "wordle");
        expect(w?.best?.result.player).toBe("sam");
        expect(w?.best?.result.date).toBe(day(2));
        expect(w?.best?.tied.map((t) => t.date)).toEqual([day(2), day(0)]);
        expect(w?.worst?.result.player).toBe("jo");
    });

    test("day records", () => {
        expect(hof.sweeps?.holders.map((h) => h.player)).toEqual(["sam", "alex"]);
        expect(hof.bestDay?.holders[0]).toMatchObject({ player: "sam", date: day(2) });
        expect(hof.mostPoints?.holders[0].player).toBe("sam");
        expect(hof.blowout?.holders[0]).toMatchObject({ player: "sam", game: "strands", players: 2 });
        expect(hof.blowout?.value).toBeCloseTo(2 / 3);
    });

    test("day ratings break down into each game's percentile and rank", () => {
        const parts = ratingParts(games, results, "sam", day(2));
        expect(parts.map((p) => [p.game.slug, p.rank, p.of])).toEqual([
            ["wordle", 1, 7],
            ["strands", 1, 4],
        ]);
        expect(parts.map((p) => p.pct)).toEqual([expect.closeTo(100 - 100 / 12), 100]);
    });

    test("sweeps keep their dates", () => {
        expect(hof.sweeps?.holders.map((h) => h.dates)).toEqual([[day(2)], [day(1)]]);
    });

    test("streaks", () => {
        expect(hof.playStreak?.value).toBe(3);
        expect(hof.playStreak?.holders.map((h) => h.player)).toEqual(["sam", "alex"]);
        expect(hof.leadStreak?.value).toBe(1);
    });

    test("solved games track solve streaks instead of best and worst", () => {
        const solved = [
            r(connections, sam, day(3), 0),
            r(connections, sam, day(2), 0),
            r(connections, sam, day(1), 1, true),
            r(connections, sam, day(0), 0),
        ];
        const c = hallOfFame([connections], solved, [], TODAY).games[0];
        expect(c.best).toBeNull();
        expect(c.solveStreak?.holders).toEqual([{ player: "sam", date: day(2), value: 2, from: day(3), game: "connections" }]);
    });

    test("reigns count finished weeks in a row", () => {
        const lastWeek = addDays(TODAY, -7);
        const weekly = [r(wordle, sam, lastWeek, 2), r(wordle, alex, lastWeek, 4)];
        const h = hallOfFame([wordle], weekly, finishedWeeks([wordle], weekly, TODAY), TODAY);
        expect(h.crownRun?.holders.map((x) => x.player)).toEqual(["sam"]);
        expect(h.crownRun?.value).toBe(1);
    });
});
