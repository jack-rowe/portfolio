export const VEGAS_PLAYER_COUNT = 4;
export const VEGAS_TOTAL_HOLES = 18;
export const VEGAS_STORAGE_KEY = "vegas:v1";

export type VegasPlayer = {
  id: string;
  name: string;
  /** Net Vegas points (can be negative). */
  points: number;
};

/** Two fixed teams of two indices into players[]. */
export type VegasTeams = {
  teamA: [number, number];
  teamB: [number, number];
};

export type VegasHole = {
  scores: number[];
};

export type VegasState = {
  mode: "vegas";
  players: VegasPlayer[];
  teams: VegasTeams;
  holes: VegasHole[];
  finishedAt?: number;
};

/** Default pairing: P1+P2 vs P3+P4. */
export const DEFAULT_VEGAS_TEAMS: VegasTeams = {
  teamA: [0, 1],
  teamB: [2, 3],
};
