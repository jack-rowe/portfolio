import type { Game, Result, ScoreType } from "~firebase/types";

export const GOLF_RANGE = 30;
export const DEFAULT_MAX = 6;
export const MAX_LIMIT = 20;

export const SCORE_TYPE_INFO: Record<ScoreType, { label: string; hint: string }> = {
    guesses: { label: "Guesses", hint: "Tries out of a max, like 4/6" },
    count: { label: "Mistakes", hint: "Fewest wins, like 2" },
    points: { label: "Points", hint: "Any number" },
    time: { label: "Time", hint: "Minutes and seconds" },
    golf: { label: "Golf", hint: "Over or under par, like -2" },
    solved: { label: "Solved", hint: "Solved or missed" },
};

/** What the entry control produces before it's turned into a stored result. */
export type Entry =
    | { kind: "pick"; value: number | "fail" }
    | { kind: "points"; raw: string }
    | { kind: "time"; minutes: string; seconds: string }
    | { kind: "golf"; value: number }
    | { kind: "solved"; solved: boolean };

export type ScoredEntry = { score: number; fail: boolean; shown: string };

export type EntryCheck = { ok: true; value: ScoredEntry } | { ok: false; error: string | null };

export function maxFor(game: Pick<Game, "max">): number {
    return game.max ?? DEFAULT_MAX;
}

export function lowerIsBetter(game: Pick<Game, "type" | "higherWins">): boolean {
    return !(game.type === "points" && game.higherWins);
}

export function formatGolf(n: number): string {
    if (n === 0) return "E";
    return n > 0 ? `+${String(n)}` : String(n);
}

export function formatTime(totalSeconds: number): string {
    const rounded = Math.round(totalSeconds);
    const m = Math.floor(rounded / 60);
    const s = rounded % 60;
    return `${String(m)}:${String(s).padStart(2, "0")}`;
}

/** Trims float noise: 2.5000000001 -> "2.5". */
export function formatNumber(n: number, digits = 2): string {
    return String(Number(n.toFixed(digits)));
}

/** The control a game starts with when its entry panel opens. */
export function blankEntry(game: Game): Entry | null {
    switch (game.type) {
        case "guesses":
        case "count":
            return null;
        case "points":
            return { kind: "points", raw: "" };
        case "time":
            return { kind: "time", minutes: "", seconds: "" };
        case "golf":
            return { kind: "golf", value: 0 };
        case "solved":
            return null;
    }
}

/** Rebuilds the control state from a saved result so re-logging starts from the old value. */
export function entryFromResult(game: Game, result: Result): Entry {
    switch (game.type) {
        case "guesses":
        case "count":
            return { kind: "pick", value: result.fail ? "fail" : result.score };
        case "points":
            return { kind: "points", raw: String(result.score) };
        case "time":
            return {
                kind: "time",
                minutes: String(Math.floor(result.score / 60)),
                seconds: String(result.score % 60),
            };
        case "golf":
            return { kind: "golf", value: result.score };
        case "solved":
            return { kind: "solved", solved: !result.fail };
    }
}

function checkTime(minutes: string, seconds: string): EntryCheck {
    if (minutes.trim() === "" && seconds.trim() === "") return { ok: false, error: null };
    const m = minutes.trim() === "" ? 0 : Number(minutes);
    const s = seconds.trim() === "" ? 0 : Number(seconds);
    if (!Number.isInteger(m) || m < 0) return { ok: false, error: "Minutes must be a whole number." };
    if (!Number.isInteger(s) || s < 0 || s > 59) return { ok: false, error: "Seconds go from 0 to 59." };
    const total = m * 60 + s;
    if (total === 0) return { ok: false, error: "Enter a time longer than 0:00." };
    return { ok: true, value: { score: total, fail: false, shown: formatTime(total) } };
}

/**
 * Validates an entry for a game and turns it into what gets stored.
 * `error` is null when nothing has been entered yet (Save just stays disabled).
 */
export function checkEntry(game: Game, entry: Entry | null): EntryCheck {
    if (!entry) return { ok: false, error: null };
    const max = maxFor(game);

    switch (entry.kind) {
        case "pick": {
            if (entry.value === "fail") {
                const shown = game.type === "guesses" ? "X" : "Lost";
                return { ok: true, value: { score: max + 1, fail: true, shown } };
            }
            const n = entry.value;
            const shown = game.type === "guesses" ? `${String(n)}/${String(max)}` : String(n);
            return { ok: true, value: { score: n, fail: false, shown } };
        }
        case "points": {
            const raw = entry.raw.trim().replace(",", ".");
            if (raw === "") return { ok: false, error: null };
            const n = Number(raw);
            if (!Number.isFinite(n)) return { ok: false, error: "Points must be a number, like 12 or 3.5." };
            return { ok: true, value: { score: n, fail: false, shown: formatNumber(n) } };
        }
        case "time":
            return checkTime(entry.minutes, entry.seconds);
        case "golf": {
            if (!Number.isInteger(entry.value) || Math.abs(entry.value) > GOLF_RANGE) {
                return { ok: false, error: `Golf scores go from -${String(GOLF_RANGE)} to +${String(GOLF_RANGE)}.` };
            }
            return { ok: true, value: { score: entry.value, fail: false, shown: formatGolf(entry.value) } };
        }
        case "solved":
            return entry.solved
                ? { ok: true, value: { score: 0, fail: false, shown: "Solved" } }
                : { ok: true, value: { score: 1, fail: true, shown: "Missed" } };
    }
}

/**
 * Sort comparator: negative when `a` is the better result.
 * Fails always rank last; among the rest, direction depends on the game.
 */
export function compareResults(game: Pick<Game, "type" | "higherWins">, a: Result, b: Result): number {
    if (a.fail !== b.fail) return a.fail ? 1 : -1;
    return lowerIsBetter(game) ? a.score - b.score : b.score - a.score;
}

/** Formats an average score for display in the standings. */
export function formatAverage(game: Game, avg: number): string {
    switch (game.type) {
        case "time":
            return formatTime(avg);
        case "golf": {
            const rounded = Number(avg.toFixed(1));
            return formatGolf(rounded);
        }
        case "solved":
            return `${String(Math.round(avg * 100))}%`;
        default:
            return avg.toFixed(1);
    }
}

/** Short description shown on a game's button before it's logged. */
export function describeGame(game: Game): string {
    if (game.type === "points") return game.higherWins ? "Points, high wins" : "Points, low wins";
    return SCORE_TYPE_INFO[game.type].label;
}
