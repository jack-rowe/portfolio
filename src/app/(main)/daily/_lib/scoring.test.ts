import { describe, expect, test } from "vitest";

import type { Game, Result } from "~firebase/types";
import { checkEntry, dayPoints, formatAverage, formatGolf, formatTime, headToHead } from "./scoring";

function game(partial: Partial<Game> & Pick<Game, "type">): Game {
    return { slug: "g", name: "G", createdAt: 0, ...partial };
}

describe("checkEntry", () => {
    test("guesses store n and show n/max; X is max + 1", () => {
        const wordle = game({ type: "guesses", max: 6, canFail: true });
        expect(checkEntry(wordle, { kind: "pick", value: 4 })).toEqual({
            ok: true,
            value: { score: 4, fail: false, shown: "4/6" },
        });
        expect(checkEntry(wordle, { kind: "pick", value: "fail" })).toEqual({
            ok: true,
            value: { score: 7, fail: true, shown: "X" },
        });
    });

    test("count shows a bare number and Lost", () => {
        const connections = game({ type: "count", max: 3, canFail: true });
        expect(checkEntry(connections, { kind: "pick", value: 0 })).toMatchObject({ value: { shown: "0" } });
        expect(checkEntry(connections, { kind: "pick", value: "fail" })).toMatchObject({
            value: { score: 4, fail: true, shown: "Lost" },
        });
    });

    test("points accept decimals and reject junk", () => {
        const strands = game({ type: "points" });
        expect(checkEntry(strands, { kind: "points", raw: "2,5" })).toMatchObject({ value: { score: 2.5, shown: "2.5" } });
        expect(checkEntry(strands, { kind: "points", raw: "" })).toEqual({ ok: false, error: null });
        expect(checkEntry(strands, { kind: "points", raw: "abc" })).toMatchObject({ ok: false });
    });

    test("time validates seconds and stores total seconds", () => {
        const mini = game({ type: "time" });
        expect(checkEntry(mini, { kind: "time", minutes: "1", seconds: "5" })).toMatchObject({
            value: { score: 65, shown: "1:05" },
        });
        expect(checkEntry(mini, { kind: "time", minutes: "", seconds: "42" })).toMatchObject({
            value: { score: 42, shown: "0:42" },
        });
        expect(checkEntry(mini, { kind: "time", minutes: "0", seconds: "60" })).toEqual({
            ok: false,
            error: "Seconds go from 0 to 59.",
        });
        expect(checkEntry(mini, { kind: "time", minutes: "", seconds: "" })).toEqual({ ok: false, error: null });
    });

    test("golf stays within ±30", () => {
        const g = game({ type: "golf" });
        expect(checkEntry(g, { kind: "golf", value: -2 })).toMatchObject({ value: { shown: "-2" } });
        expect(checkEntry(g, { kind: "golf", value: 31 })).toMatchObject({ ok: false });
    });

    test("solved stores 0 or a fail", () => {
        const g = game({ type: "solved" });
        expect(checkEntry(g, { kind: "solved", solved: true })).toMatchObject({ value: { score: 0, shown: "Solved" } });
        expect(checkEntry(g, { kind: "solved", solved: false })).toMatchObject({ value: { fail: true, shown: "Missed" } });
    });
});

describe("formatting", () => {
    test("golf and time", () => {
        expect(formatGolf(0)).toBe("E");
        expect(formatGolf(3)).toBe("+3");
        expect(formatTime(65)).toBe("1:05");
        expect(formatTime(59.6)).toBe("1:00");
    });

    test("averages per type", () => {
        expect(formatAverage(game({ type: "guesses" }), 3.75)).toBe("3.8");
        expect(formatAverage(game({ type: "time" }), 64.6)).toBe("1:05");
        expect(formatAverage(game({ type: "golf" }), -0.04)).toBe("E");
        expect(formatAverage(game({ type: "solved" }), 2 / 3)).toBe("67%");
    });
});

function res(player: string, score: number, fail = false): Result {
    return { id: player, game: "g", gameName: "G", player, date: "2026-10-27", score, fail, shown: "", createdAt: 0 };
}

/** dayPoints rounded to one decimal, in the order the results were given. */
function split(g: Game, results: Result[]): number[] {
    const points = dayPoints(g, results);
    return results.map((r) => Number((points.get(r.player) ?? 0).toFixed(1)));
}

describe("headToHead", () => {
    test("twice as bad is a crush, closer is partial, losing or tying is 0", () => {
        const wordle = game({ type: "guesses", max: 6 });
        expect(headToHead(wordle, res("a", 3), res("b", 6))).toBe(1);
        expect(headToHead(wordle, res("a", 3), res("b", 4))).toBeCloseTo(1 / 3);
        expect(headToHead(wordle, res("a", 4), res("b", 3))).toBe(0);
        expect(headToHead(wordle, res("a", 4), res("b", 4))).toBe(0);
    });

    test("beating a fail is always a crush; a fail beats nobody", () => {
        const wordle = game({ type: "guesses", max: 6 });
        expect(headToHead(wordle, res("a", 6), res("b", 7, true))).toBe(1);
        expect(headToHead(wordle, res("a", 7, true), res("b", 7, true))).toBe(0);
    });

    test("mistakes count +1 so a perfect game compares", () => {
        const connections = game({ type: "count", max: 4 });
        expect(headToHead(connections, res("a", 0), res("b", 1))).toBe(1);
        expect(headToHead(connections, res("a", 1), res("b", 2))).toBeCloseTo(0.5);
    });

    test("time and points use ratios in the winning direction", () => {
        const mini = game({ type: "time" });
        expect(headToHead(mini, res("a", 40), res("b", 60))).toBeCloseTo(0.5);
        const high = game({ type: "points", higherWins: true });
        expect(headToHead(high, res("a", 480), res("b", 300))).toBeCloseTo(0.6);
        expect(headToHead(high, res("a", 5), res("b", 0))).toBe(1);
        const low = game({ type: "points" });
        expect(headToHead(low, res("a", 0), res("b", 3))).toBe(1);
        expect(headToHead(low, res("a", 4), res("b", 5))).toBeCloseTo(0.25);
    });

    test("golf crushes at 4 strokes", () => {
        const g = game({ type: "golf" });
        expect(headToHead(g, res("a", -2), res("b", -1))).toBeCloseTo(0.25);
        expect(headToHead(g, res("a", -2), res("b", 3))).toBe(1);
    });
});

describe("dayPoints", () => {
    const solved = game({ type: "solved" });
    const wordle = game({ type: "guesses", max: 6 });

    test("solved: fewer solvers split more", () => {
        expect(split(solved, [res("a", 0), res("b", 1, true), res("c", 1, true), res("d", 1, true)])).toEqual([10, 0, 0, 0]);
        expect(split(solved, [res("a", 0), res("b", 0), res("c", 1, true), res("d", 1, true)])).toEqual([5, 5, 0, 0]);
        expect(split(solved, [res("a", 0), res("b", 0), res("c", 0), res("d", 0)])).toEqual([2.5, 2.5, 2.5, 2.5]);
    });

    test("close games split evenly, blowouts go to the winner", () => {
        expect(split(wordle, [res("a", 3), res("b", 4), res("c", 4), res("d", 5)])).toEqual([4, 2.1, 2.1, 1.7]);
        expect(split(wordle, [res("a", 2), res("b", 5), res("c", 7, true), res("d", 7, true)])).toEqual([5.7, 4.3, 0, 0]);
        const high = game({ type: "points", higherWins: true });
        expect(split(high, [res("a", 480), res("b", 300), res("c", 250), res("d", 100)])).toEqual([4, 2.5, 2.3, 1.1]);
    });

    test("the pot always adds to 10", () => {
        const points = dayPoints(wordle, [res("a", 2), res("b", 3), res("c", 6)]);
        expect([...points.values()].reduce((sum, n) => sum + n, 0)).toBeCloseTo(10);
    });

    test("no points when playing alone or when everyone failed", () => {
        expect(dayPoints(wordle, [res("a", 3)]).size).toBe(0);
        expect(dayPoints(wordle, [res("a", 7, true), res("b", 7, true)]).size).toBe(0);
    });
});
