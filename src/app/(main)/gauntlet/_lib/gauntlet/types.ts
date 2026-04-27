import type { BasePlayer, BaseState } from "../base/types";

export const GAUNTLET_TOTAL_HOLES = 18;
export const GAUNTLET_MIN_PLAYERS = 3;
export const GAUNTLET_MAX_PLAYERS = 4;
export const GAUNTLET_STORAGE_KEY = "gauntlet:v3";

export type GauntletPlayer = BasePlayer & {
  /** Index of the player currently being chased. */
  targetIndex: number;
  /** Index this player started chasing; lap completes when target wraps back here. */
  startTargetIndex: number;
};

/** Backwards-compatible alias used by existing components. */
export type Player = GauntletPlayer;

/** Scores for a single hole, indexed by player. */
export type HoleScores = number[];

export type GauntletState = BaseState<GauntletPlayer, HoleScores> & {
  mode: "gauntlet";
};
