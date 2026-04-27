import { GameEngine } from "../base/engine";
import { getCourse } from "../courseData";
import type { CourseInfo } from "../courseData";
import { netScoresForHole } from "../handicap";
import type { HandicapConfig, HandicapStartOptions } from "../handicap";
import { wolfStorage } from "./storage";
import type { WolfDecision, WolfHole, WolfPlayer, WolfState } from "./types";
import { WOLF_PLAYER_COUNT, WOLF_STORAGE_KEY, WOLF_TOTAL_HOLES } from "./types";

export type WolfScoringContext = {
  handicap?: HandicapConfig;
  course: CourseInfo | null;
};

const NO_CTX: WolfScoringContext = { course: null };

function ctxFromState(state: WolfState): WolfScoringContext {
  return {
    handicap: state.handicap,
    course: getCourse(state.handicap?.courseId),
  };
}

// Standard "Pittsburgh Wolf" point scheme. All point values flow upward;
// no negative points are recorded so leaderboard rendering stays simple.
export const PARTNER_WIN_POINTS = 2;
export const PARTNER_LOSE_POINTS = 3;
export const LONE_WIN_POINTS = 4;
export const LONE_LOSE_POINTS = 1;
export const BLIND_WIN_POINTS = 6;
export const BLIND_LOSE_POINTS = 3;

/** The Wolf rotates: hole 1 = player 0, hole 2 = player 1, etc. */
export function wolfFor(holeIndex: number, playerCount: number): number {
  if (playerCount <= 0) return 0;
  return ((holeIndex % playerCount) + playerCount) % playerCount;
}

export type Teams = {
  wolfTeam: number[];
  oppTeam: number[];
};

export function teamsFor(
  decision: WolfDecision,
  wolfIndex: number,
  playerCount: number,
): Teams {
  const all: number[] = [];
  for (let i = 0; i < playerCount; i++) all.push(i);
  if (decision.kind === "partner") {
    const partner = decision.partnerIndex;
    return {
      wolfTeam: [wolfIndex, partner],
      oppTeam: all.filter((i) => i !== wolfIndex && i !== partner),
    };
  }
  return {
    wolfTeam: [wolfIndex],
    oppTeam: all.filter((i) => i !== wolfIndex),
  };
}

function bestScore(scores: number[], indices: number[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (const i of indices) {
    const s = scores[i];
    if (s < best) best = s;
  }
  return best;
}

export type HoleAward = number[];

/**
 * Per-player point award for a single hole. Returns an array of length
 * `playerCount`. Ties produce all-zero awards.
 */
export function awardHole(
  hole: WolfHole,
  wolfIndex: number,
  playerCount: number,
  holeIndex = 0,
  ctx: WolfScoringContext = NO_CTX,
): HoleAward {
  const award: number[] = Array.from({ length: playerCount }, () => 0);
  const { wolfTeam, oppTeam } = teamsFor(hole.decision, wolfIndex, playerCount);
  if (wolfTeam.length === 0 || oppTeam.length === 0) return award;

  const net = netScoresForHole(
    hole.scores,
    holeIndex,
    ctx.handicap,
    ctx.course,
  );
  const wolfBest = bestScore(net, wolfTeam);
  const oppBest = bestScore(net, oppTeam);
  if (wolfBest === oppBest) return award;

  const wolfWon = wolfBest < oppBest;
  const lone = hole.decision.kind === "lone";
  const blind = hole.decision.kind === "lone" && hole.decision.blind;

  if (wolfWon) {
    if (blind) {
      award[wolfIndex] = BLIND_WIN_POINTS;
    } else if (lone) {
      award[wolfIndex] = LONE_WIN_POINTS;
    } else {
      for (const i of wolfTeam) award[i] = PARTNER_WIN_POINTS;
    }
  } else {
    if (blind) {
      for (const i of oppTeam) award[i] = BLIND_LOSE_POINTS;
    } else if (lone) {
      for (const i of oppTeam) award[i] = LONE_LOSE_POINTS;
    } else {
      for (const i of oppTeam) award[i] = PARTNER_LOSE_POINTS;
    }
  }
  return award;
}

/** Apply a single hole, returning a new player array (pure). */
export function applyHole(
  players: WolfPlayer[],
  hole: WolfHole,
  holeIndex: number,
  ctx: WolfScoringContext = NO_CTX,
): WolfPlayer[] {
  const wolfIdx = wolfFor(holeIndex, players.length);
  const award = awardHole(hole, wolfIdx, players.length, holeIndex, ctx);
  return players.map((p, i) => ({ ...p, points: p.points + award[i] }));
}

/** Fold all holes from an initial player state. */
export function recompute(
  initialPlayers: WolfPlayer[],
  holes: WolfHole[],
  ctx: WolfScoringContext = NO_CTX,
): WolfPlayer[] {
  return holes.reduce<WolfPlayer[]>(
    (players, hole, idx) => applyHole(players, hole, idx, ctx),
    initialPlayers,
  );
}

/** Reset points but keep ids and names, for full recompute. */
export function resetPlayers(players: WolfPlayer[]): WolfPlayer[] {
  return players.map((p) => ({ ...p, points: 0 }));
}

/** Construct the starting Player array for a fresh wolf game. */
export function makeInitialPlayers(names: string[]): WolfPlayer[] {
  return names.map((name, i) => ({
    id: makeId(i),
    name,
    points: 0,
  }));
}

export type WolfHoleOutcome = {
  /** Index of the wolf for this hole. */
  wolfIndex: number;
  /** Indices belonging to wolf's team (length 1 for lone, 2 for partner). */
  wolfTeam: number[];
  /** Indices on the opposing team. */
  oppTeam: number[];
  /** Best (lowest) team scores. */
  wolfBest: number;
  oppBest: number;
  /** "wolf" | "opp" | "tie" */
  result: "wolf" | "opp" | "tie";
  /** Per-player point award for this hole. */
  award: number[];
};

/** Per-hole derived view useful for HoleView / Scorecard / GameOverBanner. */
export function holeOutcome(
  hole: WolfHole,
  holeIndex: number,
  playerCount: number,
  ctx: WolfScoringContext = NO_CTX,
): WolfHoleOutcome {
  const wolfIdx = wolfFor(holeIndex, playerCount);
  const { wolfTeam, oppTeam } = teamsFor(hole.decision, wolfIdx, playerCount);
  const net = netScoresForHole(
    hole.scores,
    holeIndex,
    ctx.handicap,
    ctx.course,
  );
  const wolfBest = bestScore(net, wolfTeam);
  const oppBest = bestScore(net, oppTeam);
  let result: "wolf" | "opp" | "tie" = "tie";
  if (wolfBest < oppBest) result = "wolf";
  else if (oppBest < wolfBest) result = "opp";
  return {
    wolfIndex: wolfIdx,
    wolfTeam,
    oppTeam,
    wolfBest,
    oppBest,
    result,
    award: awardHole(hole, wolfIdx, playerCount, holeIndex, ctx),
  };
}

export type WolfStandings = {
  sorted: WolfPlayer[];
  winner: WolfPlayer;
  coWinners: WolfPlayer[];
  tied: boolean;
};

export function finalStandings(players: WolfPlayer[]): WolfStandings {
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

/** Validate at the boundary of UI submit so engine assumes well-formed input. */
export function decisionIsValid(
  decision: WolfDecision,
  wolfIndex: number,
  playerCount: number,
): boolean {
  if (playerCount !== WOLF_PLAYER_COUNT) return false;
  if (decision.kind === "lone") return true;
  const p = decision.partnerIndex;
  return Number.isInteger(p) && p >= 0 && p < playerCount && p !== wolfIndex;
}

function makeId(seed: number): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `w-${String(seed)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class WolfEngineImpl extends GameEngine<
  WolfState,
  WolfHole,
  WolfPlayer,
  HandicapStartOptions
> {
  readonly mode = "wolf" as const;
  readonly storageKey = WOLF_STORAGE_KEY;
  readonly totalHoles = WOLF_TOTAL_HOLES;
  readonly minPlayers = WOLF_PLAYER_COUNT;
  readonly maxPlayers = WOLF_PLAYER_COUNT;

  createInitialState(
    names: string[],
    options: HandicapStartOptions = {},
  ): WolfState | null {
    if (names.length !== WOLF_PLAYER_COUNT) return null;
    return {
      mode: "wolf",
      players: makeInitialPlayers(this.trimNames(names)),
      holes: [],
      handicap: options.handicap,
    };
  }

  validateHole(state: WolfState, hole: WolfHole, holeIndex: number): boolean {
    if (!hole || !Array.isArray(hole.scores)) return false;
    if (hole.scores.length !== state.players.length) return false;
    if (!hole.scores.every((s) => Number.isInteger(s) && s > 0)) return false;
    const wolfIdx = wolfFor(holeIndex, state.players.length);
    return decisionIsValid(hole.decision, wolfIdx, state.players.length);
  }

  applyHole(state: WolfState, hole: WolfHole): WolfState {
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

  recompute(state: WolfState): WolfState {
    return {
      ...state,
      players: recompute(
        resetPlayers(state.players),
        state.holes,
        ctxFromState(state),
      ),
    };
  }

  parseState(raw: unknown): WolfState | null {
    return wolfStorage.parse(raw);
  }
}

export const wolfEngine: WolfEngineImpl = new WolfEngineImpl();
