import { GameEngine } from "../base/engine";
import { getCourse } from "../courseData";
import type { CourseInfo } from "../courseData";
import { netScoresForHole } from "../handicap";
import type { HandicapConfig, HandicapStartOptions } from "../handicap";
import { matchplayStorage } from "./storage";
import type { MatchplayHole, MatchplayPlayer, MatchplayState } from "./types";
import {
  MATCHPLAY_MAX_PLAYERS,
  MATCHPLAY_MIN_PLAYERS,
  MATCHPLAY_STORAGE_KEY,
  MATCHPLAY_TOTAL_HOLES,
} from "./types";

export type MatchplayScoringContext = {
  handicap?: HandicapConfig;
  course: CourseInfo | null;
};

const NO_CTX: MatchplayScoringContext = { course: null };

function ctxFromState(state: MatchplayState): MatchplayScoringContext {
  return {
    handicap: state.handicap,
    course: getCourse(state.handicap?.courseId),
  };
}

export type MatchplayHoleOutcome = {
  /** Lowest score on the hole. */
  bestScore: number;
  /** Indices of all players who shot the best score. */
  bestPlayers: number[];
  /** "win" if exactly one player has the best, else "halve". */
  result: "win" | "halve";
  /** Per-player point award. +1 to the unique winner, 0 otherwise. */
  award: number[];
};

export function holeOutcome(
  hole: MatchplayHole,
  playerCount: number,
  holeIndex = 0,
  ctx: MatchplayScoringContext = NO_CTX,
): MatchplayHoleOutcome {
  const award: number[] = Array.from({ length: playerCount }, () => 0);
  const net = netScoresForHole(
    hole.scores,
    holeIndex,
    ctx.handicap,
    ctx.course,
  );
  let best = Number.POSITIVE_INFINITY;
  for (const s of net) {
    if (s < best) best = s;
  }
  const bestPlayers: number[] = [];
  net.forEach((s, i) => {
    if (s === best) bestPlayers.push(i);
  });
  if (bestPlayers.length === 1) {
    award[bestPlayers[0]] = 1;
    return { bestScore: best, bestPlayers, result: "win", award };
  }
  return { bestScore: best, bestPlayers, result: "halve", award };
}

export function awardHole(
  hole: MatchplayHole,
  playerCount: number,
  holeIndex = 0,
  ctx: MatchplayScoringContext = NO_CTX,
): number[] {
  return holeOutcome(hole, playerCount, holeIndex, ctx).award;
}

export function applyHole(
  players: MatchplayPlayer[],
  hole: MatchplayHole,
  holeIndex = 0,
  ctx: MatchplayScoringContext = NO_CTX,
): MatchplayPlayer[] {
  const award = awardHole(hole, players.length, holeIndex, ctx);
  return players.map((p, i) => ({ ...p, points: p.points + award[i] }));
}

export function recompute(
  initial: MatchplayPlayer[],
  holes: MatchplayHole[],
  ctx: MatchplayScoringContext = NO_CTX,
): MatchplayPlayer[] {
  return holes.reduce<MatchplayPlayer[]>(
    (acc, h, idx) => applyHole(acc, h, idx, ctx),
    initial,
  );
}

export function resetPlayers(players: MatchplayPlayer[]): MatchplayPlayer[] {
  return players.map((p) => ({ ...p, points: 0 }));
}

export function makeInitialPlayers(names: string[]): MatchplayPlayer[] {
  return names.map((name, i) => ({ id: makeId(i), name, points: 0 }));
}

export type MatchplayStandings = {
  sorted: MatchplayPlayer[];
  winner: MatchplayPlayer;
  coWinners: MatchplayPlayer[];
  tied: boolean;
};

export function finalStandings(players: MatchplayPlayer[]): MatchplayStandings {
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
  return `mp-${String(i)}-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`;
}

class MatchplayEngineImpl extends GameEngine<
  MatchplayState,
  MatchplayHole,
  MatchplayPlayer,
  HandicapStartOptions
> {
  readonly mode = "matchplay" as const;
  readonly storageKey = MATCHPLAY_STORAGE_KEY;
  readonly totalHoles = MATCHPLAY_TOTAL_HOLES;
  readonly minPlayers = MATCHPLAY_MIN_PLAYERS;
  readonly maxPlayers = MATCHPLAY_MAX_PLAYERS;

  createInitialState(
    names: string[],
    options: HandicapStartOptions = {},
  ): MatchplayState | null {
    if (names.length < this.minPlayers) return null;
    if (names.length > this.maxPlayers) return null;
    return {
      mode: "matchplay",
      players: makeInitialPlayers(this.trimNames(names)),
      holes: [],
      handicap: options.handicap,
    };
  }

  validateHole(state: MatchplayState, hole: MatchplayHole): boolean {
    if (!hole || !Array.isArray(hole.scores)) return false;
    if (hole.scores.length !== state.players.length) return false;
    return hole.scores.every((s) => Number.isInteger(s) && s > 0);
  }

  applyHole(state: MatchplayState, hole: MatchplayHole): MatchplayState {
    return {
      ...state,
      players: applyHole(
        state.players,
        hole,
        state.holes.length,
        ctxFromState(state),
      ),
      holes: [...state.holes, hole],
    };
  }

  recompute(state: MatchplayState): MatchplayState {
    return {
      ...state,
      players: recompute(
        resetPlayers(state.players),
        state.holes,
        ctxFromState(state),
      ),
    };
  }

  parseState(raw: unknown): MatchplayState | null {
    return matchplayStorage.parse(raw);
  }
}

export const matchplayEngine: MatchplayEngineImpl = new MatchplayEngineImpl();
