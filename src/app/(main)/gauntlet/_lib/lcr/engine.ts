import { GameEngine } from "../base/engine";
import { lcrStorage } from "./storage";
import type { LcrHole, LcrPlayer, LcrState } from "./types";
import {
  LCR_CENTER_WIN_POINTS,
  LCR_OUTSIDE_WIN_POINTS,
  LCR_PLAYER_COUNT,
  LCR_STORAGE_KEY,
  LCR_TOTAL_HOLES,
} from "./types";

export function outsideIndices(
  centerIndex: number,
  playerCount: number,
): number[] {
  const out: number[] = [];
  for (let i = 0; i < playerCount; i++) {
    if (i !== centerIndex) out.push(i);
  }
  return out;
}

function bestScore(scores: number[], indices: number[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (const i of indices) {
    if (scores[i] < best) best = scores[i];
  }
  return best;
}

export type LcrHoleOutcome = {
  centerIndex: number;
  outsideTeam: number[];
  centerScore: number;
  outsideBest: number;
  /** "center" | "outside" | "tie" */
  winner: "center" | "outside" | "tie";
  /** Per-player point award for this hole (always non-negative). */
  award: number[];
};

export function awardHole(hole: LcrHole, playerCount: number): number[] {
  const award: number[] = Array.from({ length: playerCount }, () => 0);
  const outside = outsideIndices(hole.centerIndex, playerCount);
  const centerScore = hole.scores[hole.centerIndex];
  const outsideBest = bestScore(hole.scores, outside);
  if (centerScore === outsideBest) return award;
  if (centerScore < outsideBest) {
    award[hole.centerIndex] = LCR_CENTER_WIN_POINTS;
  } else {
    for (const i of outside) award[i] = LCR_OUTSIDE_WIN_POINTS;
  }
  return award;
}

export function holeOutcome(
  hole: LcrHole,
  playerCount: number,
): LcrHoleOutcome {
  const outsideTeam = outsideIndices(hole.centerIndex, playerCount);
  const centerScore = hole.scores[hole.centerIndex];
  const outsideBest = bestScore(hole.scores, outsideTeam);
  let winner: "center" | "outside" | "tie" = "tie";
  if (centerScore < outsideBest) winner = "center";
  else if (outsideBest < centerScore) winner = "outside";
  return {
    centerIndex: hole.centerIndex,
    outsideTeam,
    centerScore,
    outsideBest,
    winner,
    award: awardHole(hole, playerCount),
  };
}

export function applyHole(players: LcrPlayer[], hole: LcrHole): LcrPlayer[] {
  const award = awardHole(hole, players.length);
  return players.map((p, i) => ({ ...p, points: p.points + award[i] }));
}

export function recompute(initial: LcrPlayer[], holes: LcrHole[]): LcrPlayer[] {
  return holes.reduce<LcrPlayer[]>((acc, h) => applyHole(acc, h), initial);
}

export function resetPlayers(players: LcrPlayer[]): LcrPlayer[] {
  return players.map((p) => ({ ...p, points: 0 }));
}

export function makeInitialPlayers(names: string[]): LcrPlayer[] {
  return names.map((name, i) => ({ id: makeId(i), name, points: 0 }));
}

export type LcrStandings = {
  sorted: LcrPlayer[];
  winner: LcrPlayer;
  coWinners: LcrPlayer[];
  tied: boolean;
};

export function finalStandings(players: LcrPlayer[]): LcrStandings {
  const sorted = [...players].sort((a, b) => b.points - a.points);
  const top = sorted[0]?.points ?? 0;
  const coWinners = sorted.filter((p) => p.points === top);
  return {
    sorted,
    winner: sorted[0],
    coWinners,
    tied: coWinners.length > 1,
  };
}

function makeId(i: number): string {
  const g: { crypto?: { randomUUID?: () => string } } =
    typeof globalThis === "undefined" ? {} : globalThis;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `lcr-${String(i)}-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`;
}

class LcrEngineImpl extends GameEngine<LcrState, LcrHole, LcrPlayer> {
  readonly mode = "lcr" as const;
  readonly storageKey = LCR_STORAGE_KEY;
  readonly totalHoles = LCR_TOTAL_HOLES;
  readonly minPlayers = LCR_PLAYER_COUNT;
  readonly maxPlayers = LCR_PLAYER_COUNT;

  createInitialState(names: string[]): LcrState | null {
    if (names.length !== LCR_PLAYER_COUNT) return null;
    return {
      mode: "lcr",
      players: makeInitialPlayers(this.trimNames(names)),
      holes: [],
    };
  }

  validateHole(state: LcrState, hole: LcrHole): boolean {
    if (!hole || !Array.isArray(hole.scores)) return false;
    if (hole.scores.length !== state.players.length) return false;
    if (
      !Number.isInteger(hole.centerIndex) ||
      hole.centerIndex < 0 ||
      hole.centerIndex >= state.players.length
    ) {
      return false;
    }
    return hole.scores.every((s) => Number.isInteger(s) && s > 0);
  }

  applyHole(state: LcrState, hole: LcrHole): LcrState {
    return {
      ...state,
      players: applyHole(state.players, hole),
      holes: [...state.holes, hole],
    };
  }

  recompute(state: LcrState): LcrState {
    return {
      ...state,
      players: recompute(resetPlayers(state.players), state.holes),
    };
  }

  parseState(raw: unknown): LcrState | null {
    return lcrStorage.parse(raw);
  }
}

export const lcrEngine: LcrEngineImpl = new LcrEngineImpl();
