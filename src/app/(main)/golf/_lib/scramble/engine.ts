import { GameEngine } from "../base/engine";
import { scrambleStorage } from "./storage";
import type {
  ScrambleHole,
  ScramblePlayer,
  ScrambleStartOptions,
  ScrambleState,
} from "./types";
import {
  SCRAMBLE_FRONT_NINE,
  SCRAMBLE_MAX_PLAYERS,
  SCRAMBLE_MIN_PLAYERS,
  SCRAMBLE_STORAGE_KEY,
  SCRAMBLE_TOTAL_HOLES,
} from "./types";

export type ScrambleHoleOutcome = {
  bestScore: number;
  bestTeams: number[];
  /** "win" if exactly one team has best, "halve" otherwise. */
  result: "win" | "halve";
  /** Per-team award (matchplay only). */
  award: number[];
};

export function holeOutcome(
  hole: ScrambleHole,
  teamCount: number,
): ScrambleHoleOutcome {
  const award: number[] = Array.from({ length: teamCount }, () => 0);
  let best = Number.POSITIVE_INFINITY;
  for (const s of hole.teamScores) {
    if (s < best) best = s;
  }
  const bestTeams: number[] = [];
  hole.teamScores.forEach((s, i) => {
    if (s === best) bestTeams.push(i);
  });
  if (bestTeams.length === 1) {
    award[bestTeams[0]] = 1;
    return { bestScore: best, bestTeams, result: "win", award };
  }
  return { bestScore: best, bestTeams, result: "halve", award };
}

export type ScrambleSplit = {
  front: number;
  back: number;
  total: number;
};

export function splitForTeam(
  teamIdx: number,
  holes: ScrambleHole[],
): ScrambleSplit {
  let front = 0;
  let back = 0;
  holes.forEach((h, i) => {
    const s = h.teamScores[teamIdx] ?? 0;
    if (i < SCRAMBLE_FRONT_NINE) front += s;
    else back += s;
  });
  return { front, back, total: front + back };
}

function makeId(i: number): string {
  const g: { crypto?: { randomUUID?: () => string } } =
    typeof globalThis === "undefined" ? {} : globalThis;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `sc-${String(i)}-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`;
}

export function makeInitialPlayers(names: string[]): ScramblePlayer[] {
  return names.map((name, i) => ({ id: makeId(i), name, points: 0 }));
}

function teamsFor(layout: "2v2" | "4v0"): number[][] {
  if (layout === "4v0") return [[0, 1, 2, 3]];
  return [
    [0, 1],
    [2, 3],
  ];
}

/** Award points to every member of the winning team (matchplay only). */
export function applyHole(
  state: ScrambleState,
  hole: ScrambleHole,
): ScramblePlayer[] {
  if (state.format !== "matchplay") return state.players;
  const out = holeOutcome(hole, state.teams.length);
  if (out.result === "halve") return state.players;
  const winnerTeam = state.teams[out.bestTeams[0]];
  const winnerSet = new Set(winnerTeam);
  return state.players.map((p, i) =>
    winnerSet.has(i) ? { ...p, points: p.points + 1 } : p,
  );
}

export function recompute(state: ScrambleState): ScrambleState {
  if (state.format !== "matchplay") {
    return {
      ...state,
      players: state.players.map((p) => ({ ...p, points: 0 })),
    };
  }
  let players = state.players.map((p) => ({ ...p, points: 0 }));
  for (const hole of state.holes) {
    const intermediate: ScrambleState = { ...state, players };
    players = applyHole(intermediate, hole);
  }
  return { ...state, players };
}

export type ScrambleStandings = {
  /** Team indices sorted best-first (matchplay: most points; strokeplay: lowest total). */
  sortedTeams: number[];
  winners: number[];
  tied: boolean;
};

export function teamPoints(state: ScrambleState, teamIdx: number): number {
  if (state.format !== "matchplay") return 0;
  const member = state.teams[teamIdx][0];
  return state.players[member]?.points ?? 0;
}

export function standings(state: ScrambleState): ScrambleStandings {
  const indices = state.teams.map((_, i) => i);
  if (state.format === "matchplay") {
    const sorted = [...indices].sort(
      (a, b) => teamPoints(state, b) - teamPoints(state, a),
    );
    const top = teamPoints(state, sorted[0]);
    const winners = sorted.filter((t) => teamPoints(state, t) === top);
    return { sortedTeams: sorted, winners, tied: winners.length > 1 };
  }
  const totals = indices.map((i) => splitForTeam(i, state.holes).total);
  const sorted = [...indices].sort((a, b) => totals[a] - totals[b]);
  const topTotal = totals[sorted[0]];
  const winners = sorted.filter((t) => totals[t] === topTotal);
  return { sortedTeams: sorted, winners, tied: winners.length > 1 };
}

class ScrambleEngineImpl extends GameEngine<
  ScrambleState,
  ScrambleHole,
  ScramblePlayer,
  ScrambleStartOptions
> {
  readonly mode = "scramble" as const;
  readonly storageKey = SCRAMBLE_STORAGE_KEY;
  readonly totalHoles = SCRAMBLE_TOTAL_HOLES;
  readonly minPlayers = SCRAMBLE_MIN_PLAYERS;
  readonly maxPlayers = SCRAMBLE_MAX_PLAYERS;

  createInitialState(
    names: string[],
    options: ScrambleStartOptions,
  ): ScrambleState | null {
    if (names.length !== SCRAMBLE_MIN_PLAYERS) return null;
    if (options.layout === "4v0" && options.format === "matchplay") {
      return null;
    }
    return {
      mode: "scramble",
      layout: options.layout,
      format: options.format,
      players: makeInitialPlayers(this.trimNames(names)),
      teams: teamsFor(options.layout),
      holes: [],
      handicap: options.handicap,
    };
  }

  validateHole(state: ScrambleState, hole: ScrambleHole): boolean {
    if (!hole || !Array.isArray(hole.teamScores)) return false;
    if (hole.teamScores.length !== state.teams.length) return false;
    return hole.teamScores.every((s) => Number.isInteger(s) && s > 0);
  }

  applyHole(state: ScrambleState, hole: ScrambleHole): ScrambleState {
    return {
      ...state,
      players: applyHole(state, hole),
      holes: [...state.holes, hole],
    };
  }

  recompute(state: ScrambleState): ScrambleState {
    return recompute(state);
  }

  parseState(raw: unknown): ScrambleState | null {
    return scrambleStorage.parse(raw);
  }
}

export const scrambleEngine: ScrambleEngineImpl = new ScrambleEngineImpl();
