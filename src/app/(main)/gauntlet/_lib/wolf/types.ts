export const WOLF_PLAYER_COUNT = 4;
export const WOLF_TOTAL_HOLES = 18;
export const WOLF_STORAGE_KEY = "wolf:v1";

export type WolfPlayer = {
  id: string;
  name: string;
  points: number;
};

/**
 * Wolf's choice for a hole.
 * - partner: Wolf takes one teammate (2v2 best-ball).
 * - lone:    Wolf plays alone. `blind` means declared before any tee shot
 *            (higher risk / higher reward).
 */
export type WolfDecision =
  | { kind: "partner"; partnerIndex: number }
  | { kind: "lone"; blind: boolean };

export type WolfHole = {
  scores: number[];
  decision: WolfDecision;
};

export type WolfState = {
  mode: "wolf";
  players: WolfPlayer[];
  holes: WolfHole[];
  /** Set when the user ends the round early; equals holes.length at end. */
  finishedAt?: number;
};
