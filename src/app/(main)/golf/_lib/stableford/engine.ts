import { GameEngine } from "../base/engine";
import type { CourseInfo } from "../courseData";
import { getCourse } from "../courseData";
import { netHoleScore } from "../handicap";
import type { HandicapConfig } from "../handicap";
import { stablefordStorage } from "./storage";
import type {
  StablefordHole,
  StablefordPlayer,
  StablefordStartOptions,
  StablefordState,
} from "./types";
import {
  STABLEFORD_FRONT_NINE,
  STABLEFORD_MAX_HANDICAP,
  STABLEFORD_MAX_PLAYERS,
  STABLEFORD_MIN_PLAYERS,
  STABLEFORD_STORAGE_KEY,
  STABLEFORD_TOTAL_HOLES,
} from "./types";

/**
 * Standard Stableford points (modified from World Handicap System):
 *   Albatross/double eagle (-3): 5
 *   Eagle (-2):                  4
 *   Birdie (-1):                 3
 *   Par (0):                     2
 *   Bogey (+1):                  1
 *   Double bogey or worse:       0
 *
 * Computed from net score (gross - handicap strokes for the hole) when
 * "strokes" handicap mode is active.
 */
export function stablefordPoints(net: number, par: number): number {
  const diff = net - par;
  const points = 2 - diff;
  if (points <= 0) return 0;
  return points;
}

/** Points earned on a single hole for one player. */
export function holePointsFor(
  gross: number,
  playerIdx: number,
  holeIndex: number,
  handicap: HandicapConfig | undefined,
  course: CourseInfo | null,
): number {
  if (!course) return 0;
  const par = course.holes[holeIndex]?.par;
  if (par === undefined) return 0;
  if (gross <= 0) return 0;
  const net = netHoleScore(gross, playerIdx, holeIndex, handicap, course);
  return stablefordPoints(net, par);
}

/** Per-hole points for every player, shape: holes[holeIdx][playerIdx]. */
export function pointsPerHole(
  holes: StablefordHole[],
  handicap: HandicapConfig | undefined,
  course: CourseInfo | null,
): number[][] {
  return holes.map((h, hi) =>
    h.scores.map((s, pi) => holePointsFor(s, pi, hi, handicap, course)),
  );
}

export type StablefordSplit = {
  /** Stableford points for holes 1-9. */
  frontPoints: number;
  /** Stableford points for holes 10-18. */
  backPoints: number;
  /** Total Stableford points. */
  totalPoints: number;
  /** Gross strokes total (for context). */
  grossTotal: number;
};

export function splitFor(
  playerIdx: number,
  holes: StablefordHole[],
  handicap: HandicapConfig | undefined,
  course: CourseInfo | null,
): StablefordSplit {
  let frontPoints = 0;
  let backPoints = 0;
  let grossTotal = 0;
  holes.forEach((h, i) => {
    const gross = h.scores[playerIdx] ?? 0;
    grossTotal += gross;
    const pts = holePointsFor(gross, playerIdx, i, handicap, course);
    if (i < STABLEFORD_FRONT_NINE) frontPoints += pts;
    else backPoints += pts;
  });
  return {
    frontPoints,
    backPoints,
    totalPoints: frontPoints + backPoints,
    grossTotal,
  };
}

export function applyHole(
  players: StablefordPlayer[],
  hole: StablefordHole,
  holeIndex: number,
  handicap: HandicapConfig | undefined,
  course: CourseInfo | null,
): StablefordPlayer[] {
  return players.map((p, i) => ({
    ...p,
    points:
      p.points +
      holePointsFor(hole.scores[i] ?? 0, i, holeIndex, handicap, course),
  }));
}

export function recompute(
  initial: StablefordPlayer[],
  holes: StablefordHole[],
  handicap: HandicapConfig | undefined,
  course: CourseInfo | null,
): StablefordPlayer[] {
  return holes.reduce<StablefordPlayer[]>(
    (acc, h, i) => applyHole(acc, h, i, handicap, course),
    initial,
  );
}

export function resetPlayers(players: StablefordPlayer[]): StablefordPlayer[] {
  return players.map((p) => ({ ...p, points: 0 }));
}

function makeId(i: number): string {
  const g: { crypto?: { randomUUID?: () => string } } =
    typeof globalThis === "undefined" ? {} : globalThis;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `sf-${String(i)}-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`;
}

export function makeInitialPlayers(
  names: string[],
  handicaps: number[],
): StablefordPlayer[] {
  return names.map((name, i) => ({
    id: makeId(i),
    name,
    points: 0,
    handicap: clampHandicap(handicaps[i] ?? 0),
  }));
}

function clampHandicap(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const i = Math.trunc(n);
  if (i < 0) return 0;
  if (i > STABLEFORD_MAX_HANDICAP) return STABLEFORD_MAX_HANDICAP;
  return i;
}

export type StablefordStandings = {
  /** Sorted descending by points (highest first). */
  sorted: StablefordPlayer[];
  /** Highest-points player. May be tied. */
  winner: StablefordPlayer;
  coWinners: StablefordPlayer[];
  tied: boolean;
};

export function finalStandings(
  players: StablefordPlayer[],
): StablefordStandings {
  const sorted = [...players].sort((a, b) => b.points - a.points);
  const top = sorted[0];
  const coWinners = sorted.filter((p) => p.points === top.points);
  return {
    sorted,
    winner: top,
    coWinners,
    tied: coWinners.length > 1,
  };
}

class StablefordEngineImpl extends GameEngine<
  StablefordState,
  StablefordHole,
  StablefordPlayer,
  StablefordStartOptions
> {
  readonly mode = "stableford" as const;
  readonly storageKey = STABLEFORD_STORAGE_KEY;
  readonly totalHoles = STABLEFORD_TOTAL_HOLES;
  readonly minPlayers = STABLEFORD_MIN_PLAYERS;
  readonly maxPlayers = STABLEFORD_MAX_PLAYERS;

  createInitialState(
    names: string[],
    options: StablefordStartOptions = {},
  ): StablefordState | null {
    if (names.length < this.minPlayers) return null;
    if (names.length > this.maxPlayers) return null;
    // Stableford requires a course (par data) to compute points.
    if (!options.handicap?.courseId) return null;
    if (!getCourse(options.handicap.courseId)) return null;

    const fromConfig = options.handicap.handicaps;
    const handicaps =
      options.handicaps ??
      (Array.isArray(fromConfig) && fromConfig.length === names.length
        ? fromConfig
        : Array.from({ length: names.length }, () => 0));
    if (!Array.isArray(handicaps) || handicaps.length !== names.length) {
      return null;
    }
    return {
      mode: "stableford",
      players: makeInitialPlayers(this.trimNames(names), handicaps),
      holes: [],
      handicap: options.handicap,
    };
  }

  validateHole(state: StablefordState, hole: StablefordHole): boolean {
    if (!hole || !Array.isArray(hole.scores)) return false;
    if (hole.scores.length !== state.players.length) return false;
    return hole.scores.every((s) => Number.isInteger(s) && s > 0);
  }

  applyHole(state: StablefordState, hole: StablefordHole): StablefordState {
    const holeIndex = state.holes.length;
    const course = getCourse(state.handicap?.courseId);
    return {
      ...state,
      players: applyHole(
        state.players,
        hole,
        holeIndex,
        state.handicap,
        course,
      ),
      holes: [...state.holes, hole],
    };
  }

  recompute(state: StablefordState): StablefordState {
    const course = getCourse(state.handicap?.courseId);
    return {
      ...state,
      players: recompute(
        resetPlayers(state.players),
        state.holes,
        state.handicap,
        course,
      ),
    };
  }

  parseState(raw: unknown): StablefordState | null {
    return stablefordStorage.parse(raw);
  }
}

export const stablefordEngine: StablefordEngineImpl =
  new StablefordEngineImpl();
