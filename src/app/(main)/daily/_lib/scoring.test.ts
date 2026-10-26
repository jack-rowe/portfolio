import { describe, expect, test } from "vitest";

import type { Game } from "~firebase/types";
import { checkEntry, formatAverage, formatGolf, formatTime } from "./scoring";

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
