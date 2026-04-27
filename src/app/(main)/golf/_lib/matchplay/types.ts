import type { BasePlayer, BaseState } from "../base/types";

export const MATCHPLAY_MIN_PLAYERS = 2;
export const MATCHPLAY_MAX_PLAYERS = 4;
export const MATCHPLAY_TOTAL_HOLES = 18;
export const MATCHPLAY_STORAGE_KEY = "matchplay:v1";

export type MatchplayPlayer = BasePlayer;

export type MatchplayHole = {
  scores: number[];
};

export type MatchplayState = BaseState<MatchplayPlayer, MatchplayHole> & {
  mode: "matchplay";
};
