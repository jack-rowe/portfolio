import type { BasePlayer, BaseState } from "../base/types";

export const STROKEPLAY_MIN_PLAYERS = 1;
export const STROKEPLAY_MAX_PLAYERS = 4;
export const STROKEPLAY_TOTAL_HOLES = 18;
export const STROKEPLAY_FRONT_NINE = 9;
export const STROKEPLAY_MAX_HANDICAP = 54;
export const STROKEPLAY_STORAGE_KEY = "strokeplay:v1";

export type StrokeplayPlayer = BasePlayer & {
  /** 0-54. Subtracted from gross total to compute net. */
  handicap: number;
};

export type StrokeplayHole = {
  /** Gross strokes per player. */
  scores: number[];
};

export type StrokeplayState = BaseState<StrokeplayPlayer, StrokeplayHole> & {
  mode: "strokeplay";
};

export type StrokeplayStartOptions = {
  handicaps: number[];
};
