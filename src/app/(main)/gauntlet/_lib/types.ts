export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 4;
export const DEFAULT_PLAYER_COUNT = 4;
export const TOTAL_HOLES = 18;
export const STORAGE_KEY = "gauntlet:v2";
export const LAST_NAMES_KEY = "gauntlet:lastNames:v1";

export type Player = {
  id: string;
  name: string;
  points: number;
  /** Index of the player currently being chased. */
  targetIndex: number;
  /** Index this player started chasing; lap completes when target wraps back here. */
  startTargetIndex: number;
};

/** Scores for a single hole, indexed by player. */
export type HoleScores = number[];

export type GauntletState = {
  players: Player[];
  holes: HoleScores[];
  /** Set when the user ends the round early; equals holes.length at the moment of ending. */
  finishedAt?: number;
};
