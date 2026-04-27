import type { BasePlayer, BaseState } from "../base/types";
import type { HandicapStartOptions } from "../handicap";

export const STABLEFORD_MIN_PLAYERS = 1;
export const STABLEFORD_MAX_PLAYERS = 4;
export const STABLEFORD_TOTAL_HOLES = 18;
export const STABLEFORD_FRONT_NINE = 9;
export const STABLEFORD_MAX_HANDICAP = 54;
export const STABLEFORD_STORAGE_KEY = "stableford:v1";

export type StablefordPlayer = BasePlayer & {
  /** 0-54. Used with strokes-mode handicap allocation. */
  handicap: number;
};

export type StablefordHole = {
  /** Gross strokes per player. */
  scores: number[];
};

export type StablefordState = BaseState<StablefordPlayer, StablefordHole> & {
  mode: "stableford";
};

export type StablefordStartOptions = HandicapStartOptions & {
  /** Optional explicit per-player handicap override (legacy). */
  handicaps?: number[];
};
