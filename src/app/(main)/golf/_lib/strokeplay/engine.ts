import { GameEngine } from "../base/engine";
import { strokeplayStorage } from "./storage";
import type {
  StrokeplayHole,
  StrokeplayPlayer,
  StrokeplayStartOptions,
  StrokeplayState,
} from "./types";
import {
  STROKEPLAY_FRONT_NINE,
  STROKEPLAY_MAX_HANDICAP,
  STROKEPLAY_MAX_PLAYERS,
  STROKEPLAY_MIN_PLAYERS,
  STROKEPLAY_STORAGE_KEY,
  STROKEPLAY_TOTAL_HOLES,
} from "./types";

export type StrokeplaySplit = {
  /** Gross strokes for holes 1-9. */
  front: number;
  /** Gross strokes for holes 10-18. */
  back: number;
  /** Gross strokes total (front + back). */
  total: number;
  /** Total minus handicap. May be negative for low handicaps + low totals. */
  net: number;
};

export function splitFor(
  player: StrokeplayPlayer,
  playerIdx: number,
  holes: StrokeplayHole[],
): StrokeplaySplit {
  let front = 0;
  let back = 0;
  holes.forEach((h, i) => {
    const s = h.scores[playerIdx] ?? 0;
    if (i < STROKEPLAY_FRONT_NINE) front += s;
    else back += s;
  });
  const total = front + back;
  return { front, back, total, net: total - player.handicap };
}

export function applyHole(
  players: StrokeplayPlayer[],
  hole: StrokeplayHole,
): StrokeplayPlayer[] {
  return players.map((p, i) => ({
    ...p,
    points: p.points + (hole.scores[i] ?? 0),
  }));
}

export function recompute(
  initial: StrokeplayPlayer[],
  holes: StrokeplayHole[],
): StrokeplayPlayer[] {
  return holes.reduce<StrokeplayPlayer[]>(
    (acc, h) => applyHole(acc, h),
    initial,
  );
}

export function resetPlayers(players: StrokeplayPlayer[]): StrokeplayPlayer[] {
  return players.map((p) => ({ ...p, points: 0 }));
}

function makeId(i: number): string {
  const g: { crypto?: { randomUUID?: () => string } } =
    typeof globalThis === "undefined" ? {} : globalThis;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `sp-${String(i)}-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`;
}

export function makeInitialPlayers(
  names: string[],
  handicaps: number[],
): StrokeplayPlayer[] {
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
  if (i > STROKEPLAY_MAX_HANDICAP) return STROKEPLAY_MAX_HANDICAP;
  return i;
}

export type StrokeplayStandings = {
  /** Sorted ascending by net (lowest first). */
  sorted: StrokeplayPlayer[];
  /** Best (lowest) net player. May be tied. */
  winner: StrokeplayPlayer;
  coWinners: StrokeplayPlayer[];
  tied: boolean;
};

export function finalStandings(
  players: StrokeplayPlayer[],
): StrokeplayStandings {
  const sorted = [...players].sort(
    (a, b) => a.points - a.handicap - (b.points - b.handicap),
  );
  const top = sorted[0];
  const topNet = top.points - top.handicap;
  const coWinners = sorted.filter((p) => p.points - p.handicap === topNet);
  return {
    sorted,
    winner: top,
    coWinners,
    tied: coWinners.length > 1,
  };
}

class StrokeplayEngineImpl extends GameEngine<
  StrokeplayState,
  StrokeplayHole,
  StrokeplayPlayer,
  StrokeplayStartOptions
> {
  readonly mode = "strokeplay" as const;
  readonly storageKey = STROKEPLAY_STORAGE_KEY;
  readonly totalHoles = STROKEPLAY_TOTAL_HOLES;
  readonly minPlayers = STROKEPLAY_MIN_PLAYERS;
  readonly maxPlayers = STROKEPLAY_MAX_PLAYERS;

  createInitialState(
    names: string[],
    options: StrokeplayStartOptions,
  ): StrokeplayState | null {
    if (names.length < this.minPlayers) return null;
    if (names.length > this.maxPlayers) return null;
    const handicaps = options.handicaps;
    if (!Array.isArray(handicaps) || handicaps.length !== names.length) {
      return null;
    }
    return {
      mode: "strokeplay",
      players: makeInitialPlayers(this.trimNames(names), handicaps),
      holes: [],
    };
  }

  validateHole(state: StrokeplayState, hole: StrokeplayHole): boolean {
    if (!hole || !Array.isArray(hole.scores)) return false;
    if (hole.scores.length !== state.players.length) return false;
    return hole.scores.every((s) => Number.isInteger(s) && s > 0);
  }

  applyHole(state: StrokeplayState, hole: StrokeplayHole): StrokeplayState {
    return {
      ...state,
      players: applyHole(state.players, hole),
      holes: [...state.holes, hole],
    };
  }

  recompute(state: StrokeplayState): StrokeplayState {
    return {
      ...state,
      players: recompute(resetPlayers(state.players), state.holes),
    };
  }

  parseState(raw: unknown): StrokeplayState | null {
    return strokeplayStorage.parse(raw);
  }
}

export const strokeplayEngine: StrokeplayEngineImpl =
  new StrokeplayEngineImpl();
