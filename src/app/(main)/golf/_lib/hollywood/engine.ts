import { GameEngine } from "../base/engine";
import { hollywoodStorage } from "./storage";
import type {
  HollywoodHole,
  HollywoodPlayer,
  HollywoodSegment,
  HollywoodState,
} from "./types";
import {
  HOLLYWOOD_PLAYER_COUNT,
  HOLLYWOOD_SEGMENT_HOLES,
  HOLLYWOOD_STORAGE_KEY,
  HOLLYWOOD_TOTAL_HOLES,
} from "./types";

/**
 * 6-6-6 partner rotation. Three fixed segments of 6 holes:
 *   Holes  1-6 : (P1+P2) vs (P3+P4)
 *   Holes  7-12: (P1+P3) vs (P2+P4)
 *   Holes 13-18: (P1+P4) vs (P2+P3)
 */
export const SEGMENTS: readonly HollywoodSegment[] = [
  { teamA: [0, 1], teamB: [2, 3] },
  { teamA: [0, 2], teamB: [1, 3] },
  { teamA: [0, 3], teamB: [1, 2] },
];

export function segmentOf(holeIndex: number): number {
  if (holeIndex < HOLLYWOOD_SEGMENT_HOLES) return 0;
  if (holeIndex < HOLLYWOOD_SEGMENT_HOLES * 2) return 1;
  return 2;
}

export function pairsForHole(holeIndex: number): HollywoodSegment {
  return SEGMENTS[segmentOf(holeIndex)];
}

function bestScore(scores: number[], indices: number[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (const i of indices) {
    if (scores[i] < best) best = scores[i];
  }
  return best;
}

export type HollywoodHoleOutcome = {
  segment: number;
  teamA: [number, number];
  teamB: [number, number];
  bestA: number;
  bestB: number;
  winner: "A" | "B" | "tie";
  /** +1 to each player on the winning team, 0 otherwise. */
  award: number[];
};

export function holeOutcome(
  hole: HollywoodHole,
  holeIndex: number,
  playerCount: number,
): HollywoodHoleOutcome {
  const seg = segmentOf(holeIndex);
  const { teamA, teamB } = SEGMENTS[seg];
  const bestA = bestScore(hole.scores, teamA);
  const bestB = bestScore(hole.scores, teamB);
  let winner: "A" | "B" | "tie" = "tie";
  if (bestA < bestB) winner = "A";
  else if (bestB < bestA) winner = "B";
  const award: number[] = Array.from({ length: playerCount }, () => 0);
  if (winner === "A") for (const i of teamA) award[i] = 1;
  else if (winner === "B") for (const i of teamB) award[i] = 1;
  return { segment: seg, teamA, teamB, bestA, bestB, winner, award };
}

export function applyHole(
  players: HollywoodPlayer[],
  hole: HollywoodHole,
  holeIndex: number,
): HollywoodPlayer[] {
  const { award } = holeOutcome(hole, holeIndex, players.length);
  return players.map((p, i) => ({ ...p, points: p.points + award[i] }));
}

export function recompute(
  initial: HollywoodPlayer[],
  holes: HollywoodHole[],
): HollywoodPlayer[] {
  return holes.reduce<HollywoodPlayer[]>(
    (acc, h, idx) => applyHole(acc, h, idx),
    initial,
  );
}

export function resetPlayers(players: HollywoodPlayer[]): HollywoodPlayer[] {
  return players.map((p) => ({ ...p, points: 0 }));
}

export function makeInitialPlayers(names: string[]): HollywoodPlayer[] {
  return names.map((name, i) => ({
    id: makeId(i),
    name,
    points: 0,
  }));
}

export type SegmentScore = {
  teamAWins: number;
  teamBWins: number;
  ties: number;
  /** "A" | "B" | "tie" — winner of the segment by holes won. */
  winner: "A" | "B" | "tie";
};

export function segmentScores(holes: HollywoodHole[]): SegmentScore[] {
  const result: SegmentScore[] = SEGMENTS.map(() => ({
    teamAWins: 0,
    teamBWins: 0,
    ties: 0,
    winner: "tie",
  }));
  holes.forEach((h, idx) => {
    const out = holeOutcome(h, idx, HOLLYWOOD_PLAYER_COUNT);
    const seg = result[out.segment];
    if (out.winner === "A") seg.teamAWins++;
    else if (out.winner === "B") seg.teamBWins++;
    else seg.ties++;
  });
  for (const seg of result) {
    if (seg.teamAWins > seg.teamBWins) seg.winner = "A";
    else if (seg.teamBWins > seg.teamAWins) seg.winner = "B";
    else seg.winner = "tie";
  }
  return result;
}

export type HollywoodStandings = {
  sorted: HollywoodPlayer[];
  winner: HollywoodPlayer;
  coWinners: HollywoodPlayer[];
  tied: boolean;
};

export function finalStandings(players: HollywoodPlayer[]): HollywoodStandings {
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
  return `h-${String(i)}-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`;
}

class HollywoodEngineImpl extends GameEngine<
  HollywoodState,
  HollywoodHole,
  HollywoodPlayer
> {
  readonly mode = "hollywood" as const;
  readonly storageKey = HOLLYWOOD_STORAGE_KEY;
  readonly totalHoles = HOLLYWOOD_TOTAL_HOLES;
  readonly minPlayers = HOLLYWOOD_PLAYER_COUNT;
  readonly maxPlayers = HOLLYWOOD_PLAYER_COUNT;

  createInitialState(names: string[]): HollywoodState | null {
    if (names.length !== HOLLYWOOD_PLAYER_COUNT) return null;
    return {
      mode: "hollywood",
      players: makeInitialPlayers(this.trimNames(names)),
      holes: [],
    };
  }

  validateHole(state: HollywoodState, hole: HollywoodHole): boolean {
    if (!hole || !Array.isArray(hole.scores)) return false;
    if (hole.scores.length !== state.players.length) return false;
    return hole.scores.every((s) => Number.isInteger(s) && s > 0);
  }

  applyHole(state: HollywoodState, hole: HollywoodHole): HollywoodState {
    return {
      ...state,
      players: applyHole(state.players, hole, state.holes.length),
      holes: [...state.holes, hole],
    };
  }

  recompute(state: HollywoodState): HollywoodState {
    return {
      ...state,
      players: recompute(resetPlayers(state.players), state.holes),
    };
  }

  parseState(raw: unknown): HollywoodState | null {
    return hollywoodStorage.parse(raw);
  }
}

export const hollywoodEngine: HollywoodEngineImpl = new HollywoodEngineImpl();
