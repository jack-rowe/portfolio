import type { BasePlayer, BaseState } from "../base/types";

export const LCR_PLAYER_COUNT = 3;
export const LCR_TOTAL_HOLES = 18;
export const LCR_STORAGE_KEY = "lcr:v1";

/** Center wins solo: +2. Outside team wins best-ball: +1 each. */
export const LCR_CENTER_WIN_POINTS = 2;
export const LCR_OUTSIDE_WIN_POINTS = 1;

export type LcrPlayer = BasePlayer;

export type LcrHole = {
  scores: number[];
  /** Index of the player in the Center position this hole. */
  centerIndex: number;
};

export type LcrState = BaseState<LcrPlayer, LcrHole> & {
  mode: "lcr";
};
