import type { HandicapConfig } from "../handicap";

export const HOLLYWOOD_PLAYER_COUNT = 4;
export const HOLLYWOOD_TOTAL_HOLES = 18;
export const HOLLYWOOD_SEGMENT_HOLES = 6;
export const HOLLYWOOD_SEGMENT_COUNT = 3;
export const HOLLYWOOD_STORAGE_KEY = "hollywood:v1";

export type HollywoodPlayer = {
  id: string;
  name: string;
  /** Holes-won total across all three segments. */
  points: number;
};

export type HollywoodHole = {
  scores: number[];
};

export type HollywoodState = {
  mode: "hollywood";
  players: HollywoodPlayer[];
  holes: HollywoodHole[];
  finishedAt?: number;
  handicap?: HandicapConfig;
};

/** Pair indices for each segment's two teams. */
export type HollywoodPair = [number, number];
export type HollywoodSegment = {
  teamA: HollywoodPair;
  teamB: HollywoodPair;
};
