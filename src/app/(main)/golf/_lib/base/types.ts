import type { GameMode } from "../types";
import type { HandicapConfig } from "../handicap";

/**
 * Minimum shape every game's player object must satisfy. Subclasses are free
 * to extend this with mode-specific fields (e.g. Gauntlet adds targetIndex).
 */
export type BasePlayer = {
  id: string;
  name: string;
  /** Current points / score. May be negative for modes like Vegas. */
  points: number;
};

/**
 * Minimum shape every persisted game state must satisfy. Each mode's State
 * type extends this with its discriminator and any mode-specific extras
 * (e.g. Vegas adds `teams`).
 */
export type BaseState<
  TPlayer extends BasePlayer = BasePlayer,
  THole = unknown,
> = {
  mode: GameMode;
  players: TPlayer[];
  holes: THole[];
  /** Set when the user ends the round early; equals holes.length at end. */
  finishedAt?: number;
  /** Optional handicap configuration. Absent => no handicapping. */
  handicap?: HandicapConfig;
};
