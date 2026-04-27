import type { BasePlayer, BaseState } from "../base/types";
import type { HandicapStartOptions } from "../handicap";

export const SCRAMBLE_PLAYER_COUNT = 4;
export const SCRAMBLE_MIN_PLAYERS = SCRAMBLE_PLAYER_COUNT;
export const SCRAMBLE_MAX_PLAYERS = SCRAMBLE_PLAYER_COUNT;
export const SCRAMBLE_TOTAL_HOLES = 18;
export const SCRAMBLE_FRONT_NINE = 9;
export const SCRAMBLE_STORAGE_KEY = "scramble:v1";

export type ScrambleLayout = "2v2" | "4v0";
export type ScrambleFormat = "matchplay" | "strokeplay";

export type ScramblePlayer = BasePlayer;

export type ScrambleHole = {
  /** One gross score per team. Length === state.teams.length. */
  teamScores: number[];
};

export type ScrambleState = BaseState<ScramblePlayer, ScrambleHole> & {
  mode: "scramble";
  layout: ScrambleLayout;
  format: ScrambleFormat;
  /** Player indices per team. 2v2 -> 2 teams of 2. 4v0 -> 1 team of 4. */
  teams: number[][];
};

export type ScrambleStartOptions = HandicapStartOptions & {
  layout: ScrambleLayout;
  format: ScrambleFormat;
};

export const TEAM_LABELS = ["A", "B"];
