/**
 * Shared shapes for the Daily Games League. These are plain data types with
 * Firestore timestamps already converted to epoch milliseconds, so UI code
 * never touches the Firebase SDK.
 */

export const SCORE_TYPES = ["guesses", "count", "points", "time", "golf", "solved"] as const;

export type ScoreType = (typeof SCORE_TYPES)[number];

export type Player = {
    /** Document ID, derived from the name. */
    slug: string;
    name: string;
    createdAt: number;
};

export type Game = {
    /** Document ID, derived from the name. */
    slug: string;
    name: string;
    type: ScoreType;
    /** Highest button for `guesses` and `count`. Fail is stored as max + 1. */
    max?: number;
    /** Adds an X / Lost button for `guesses` and `count`. */
    canFail?: boolean;
    /** For `points`: highest score wins instead of lowest. */
    higherWins?: boolean;
    createdAt: number;
};

/** Fields the caller supplies when creating a game. */
export type NewGame = Omit<Game, "slug" | "createdAt">;

export type Result = {
    /** `{game}-{date}-{player}`; logging the same game, day and player again overwrites. */
    id: string;
    /** Game slug. */
    game: string;
    gameName: string;
    /** Player slug. */
    player: string;
    /** Local calendar date, YYYY-MM-DD. */
    date: string;
    /** Lower is better unless the game has `higherWins`. */
    score: number;
    fail: boolean;
    /** Display string, e.g. "4/6", "0:42", "E", "X". */
    shown: string;
    createdAt: number;
};

/** Fields the caller supplies when saving a result. */
export type NewResult = Omit<Result, "id" | "createdAt">;
