import { GameEngine } from "../base/engine";
import { getCourse } from "../courseData";
import type { CourseInfo } from "../courseData";
import { netScoresForHole } from "../handicap";
import type { HandicapConfig, HandicapStartOptions } from "../handicap";
import { gauntletStorage } from "./storage";
import {
  GAUNTLET_MAX_PLAYERS,
  GAUNTLET_MIN_PLAYERS,
  GAUNTLET_STORAGE_KEY,
  GAUNTLET_TOTAL_HOLES,
} from "./types";
import type { GauntletState, HoleScores, Player } from "./types";

export type GauntletScoringContext = {
  handicap?: HandicapConfig;
  course: CourseInfo | null;
};

const NO_CTX: GauntletScoringContext = { course: null };

function ctxFromState(state: GauntletState): GauntletScoringContext {
  return {
    handicap: state.handicap,
    course: getCourse(state.handicap?.courseId),
  };
}

/** Advance a single player's target by one slot, skipping themselves. */
export function advanceTarget(
  playerIdx: number,
  currentTarget: number,
  total: number,
): number {
  let next = (currentTarget + 1) % total;
  if (next === playerIdx) next = (next + 1) % total;
  return next;
}

/**
 * Ordered list of targets the player chases in one full lap, starting at
 * `startTarget`. Length is always `total - 1`.
 */
export function chaseOrder(
  playerIdx: number,
  startTarget: number,
  total: number,
): number[] {
  const order: number[] = [];
  let t = startTarget;
  for (let i = 0; i < total - 1; i++) {
    order.push(t);
    t = advanceTarget(playerIdx, t, total);
  }
  return order;
}

/** Apply a single hole's scores to the player list, returning a new array. */
export function applyHole(
  players: Player[],
  scores: HoleScores,
  holeIndex = 0,
  ctx: GauntletScoringContext = NO_CTX,
): Player[] {
  const total = players.length;
  const net = netScoresForHole(scores, holeIndex, ctx.handicap, ctx.course);
  return players.map((p, i) => {
    const myScore = net[i];
    const targetScore = net[p.targetIndex];
    if (myScore >= targetScore) return { ...p };
    const next = advanceTarget(i, p.targetIndex, total);
    if (next === p.startTargetIndex) {
      // Completed a full lap → score a point and reset to start target.
      return { ...p, points: p.points + 1, targetIndex: p.startTargetIndex };
    }
    return { ...p, targetIndex: next };
  });
}

/** Fold an entire list of holes from an initial player state. */
export function recompute(
  initialPlayers: Player[],
  holes: HoleScores[],
  ctx: GauntletScoringContext = NO_CTX,
): Player[] {
  return holes.reduce<Player[]>(
    (players, scores, idx) => applyHole(players, scores, idx, ctx),
    initialPlayers,
  );
}

/** Construct the starting Player array for a fresh game. */
export function makeInitialPlayers(names: string[]): Player[] {
  const total = names.length;
  return names.map((name, i) => ({
    id: makeId(i),
    name,
    points: 0,
    targetIndex: (i + 1) % total,
    startTargetIndex: (i + 1) % total,
  }));
}

/** Reset points and targets but keep ids and names, for full recompute. */
export function resetPlayers(players: Player[]): Player[] {
  const total = players.length;
  return players.map((p, i) => ({
    ...p,
    points: 0,
    targetIndex: (i + 1) % total,
    startTargetIndex: (i + 1) % total,
  }));
}

export type LapProgress = { beaten: number; lapLength: number };

/** Per-hole outcome for one player. */
export type HoleOutcome = {
  /** True when this player beat their target on this hole. */
  advanced: boolean;
  /** True when this advance also completed a lap (scored a gauntlet). */
  gauntlet: boolean;
};

/**
 * Derive per-hole outcomes for each player by folding through the holes.
 * Returns a matrix indexed `[holeIndex][playerIndex]`.
 */
export function holeOutcomes(
  initialPlayers: Player[],
  holes: HoleScores[],
  ctx: GauntletScoringContext = NO_CTX,
): HoleOutcome[][] {
  const matrix: HoleOutcome[][] = [];
  let players = initialPlayers;
  holes.forEach((scores, idx) => {
    const before = players;
    const after = applyHole(before, scores, idx, ctx);
    const net = netScoresForHole(scores, idx, ctx.handicap, ctx.course);
    matrix.push(
      before.map((p, i) => ({
        advanced: net[i] < net[p.targetIndex],
        gauntlet: after[i].points > p.points,
      })),
    );
    players = after;
  });
  return matrix;
}

/** Number of opponents beaten so far on the current lap. */
export function lapProgress(
  player: Player,
  playerIdx: number,
  total: number,
): LapProgress {
  const order = chaseOrder(playerIdx, player.startTargetIndex, total);
  return {
    beaten: Math.max(0, order.indexOf(player.targetIndex)),
    lapLength: total - 1,
  };
}

export type RankedPlayer = Player & {
  idx: number;
  beaten: number;
  lapLength: number;
};

export type FinalStandings = {
  /** The single winner, or first alphabetically in a full tie — use coWinners to detect. */
  winner: RankedPlayer;
  /** All players who share the top points AND beaten count. Length > 1 means a true tie. */
  coWinners: RankedPlayer[];
  /** True when the points leader is decided by beaten count (not a clean sweep). */
  tieBroken: boolean;
};

/**
 * Derive final standings from the post-game player list.
 * Primary sort: points descending. Secondary: lap progress (beaten) descending.
 */
export function finalStandings(players: Player[]): FinalStandings {
  const total = players.length;
  const ranked: RankedPlayer[] = players
    .map((p, idx) => {
      const { beaten, lapLength } = lapProgress(p, idx, total);
      return { ...p, idx, beaten, lapLength };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.beaten - a.beaten;
    });

  const winner = ranked[0];
  const coWinners = ranked.filter(
    (p) => p.points === winner.points && p.beaten === winner.beaten,
  );
  const tiedOnPoints = ranked.filter((p) => p.points === winner.points);
  const tieBroken = tiedOnPoints.length > 1 && coWinners.length === 1;

  return { winner, coWinners, tieBroken };
}

function makeId(seed: number): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `p-${String(seed)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class GauntletEngineImpl extends GameEngine<
  GauntletState,
  HoleScores,
  Player,
  HandicapStartOptions
> {
  readonly mode = "gauntlet" as const;
  readonly storageKey = GAUNTLET_STORAGE_KEY;
  readonly totalHoles = GAUNTLET_TOTAL_HOLES;
  readonly minPlayers = GAUNTLET_MIN_PLAYERS;
  readonly maxPlayers = GAUNTLET_MAX_PLAYERS;

  createInitialState(
    names: string[],
    options: HandicapStartOptions = {},
  ): GauntletState | null {
    if (names.length < this.minPlayers) return null;
    if (names.length > this.maxPlayers) return null;
    return {
      mode: "gauntlet",
      players: makeInitialPlayers(this.trimNames(names)),
      holes: [],
      handicap: options.handicap,
    };
  }

  validateHole(state: GauntletState, hole: HoleScores): boolean {
    if (!Array.isArray(hole)) return false;
    if (hole.length !== state.players.length) return false;
    return hole.every((s) => Number.isInteger(s) && s > 0);
  }

  applyHole(state: GauntletState, hole: HoleScores): GauntletState {
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

  recompute(state: GauntletState): GauntletState {
    return {
      ...state,
      players: recompute(
        resetPlayers(state.players),
        state.holes,
        ctxFromState(state),
      ),
    };
  }

  parseState(raw: unknown): GauntletState | null {
    return gauntletStorage.parse(raw);
  }
}

export const gauntletEngine: GauntletEngineImpl = new GauntletEngineImpl();
