// Cross-cutting constants and types shared across all game modes.

/** Cross-mode bounds. Match Play allows 2 players; other modes enforce
 * stricter mode-specific bounds via their engines. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const DEFAULT_PLAYER_COUNT = 4;

export const LAST_NAMES_KEY = "gauntlet:lastNames:v1";
export const ACTIVE_MODE_KEY = "gauntlet:activeMode:v1";
export const LAST_MODE_KEY = "gauntlet:lastMode:v1";

export type GameMode =
  | "gauntlet"
  | "wolf"
  | "vegas"
  | "hollywood"
  | "lcr"
  | "matchplay";
export const DEFAULT_GAME_MODE: GameMode = "gauntlet";
export const ALL_GAME_MODES: GameMode[] = [
  "gauntlet",
  "wolf",
  "vegas",
  "hollywood",
  "lcr",
  "matchplay",
];
