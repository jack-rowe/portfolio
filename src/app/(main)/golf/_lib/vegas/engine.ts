import { GameEngine } from "../base/engine";
import { getCourse } from "../courseData";
import type { CourseInfo } from "../courseData";
import { netScoresForHole } from "../handicap";
import type { HandicapConfig } from "../handicap";
import { vegasStorage } from "./storage";
import type {
  VegasHole,
  VegasPlayer,
  VegasStartOptions,
  VegasState,
  VegasTeams,
} from "./types";
import {
  DEFAULT_VEGAS_TEAMS,
  VEGAS_PLAYER_COUNT,
  VEGAS_STORAGE_KEY,
  VEGAS_TOTAL_HOLES,
} from "./types";

export type VegasScoringContext = {
  handicap?: HandicapConfig;
  course: CourseInfo | null;
};

const NO_CTX: VegasScoringContext = { course: null };

function ctxFromState(state: VegasState): VegasScoringContext {
  return {
    handicap: state.handicap,
    course: getCourse(state.handicap?.courseId),
  };
}

/**
 * Combine two scores into Vegas's two-digit number: low first, high second.
 * Concatenated as digits, so a double-digit score still appears in full.
 * Example: scores 3 and 5 → 35. Scores 4 and 11 → 411.
 */
export function teamNumber(scores: number[], pair: [number, number]): number {
  const a = scores[pair[0]];
  const b = scores[pair[1]];
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return Number.parseInt(`${String(lo)}${String(hi)}`, 10);
}

export type VegasHoleOutcome = {
  numberA: number;
  numberB: number;
  diff: number;
  winner: "A" | "B" | "tie";
  /** Per-player point delta for this hole (can be negative). */
  award: number[];
};

/** Per-player points delta for one hole (winners +diff, losers -diff). */
export function awardHole(
  hole: VegasHole,
  teams: VegasTeams,
  playerCount: number,
  holeIndex = 0,
  ctx: VegasScoringContext = NO_CTX,
): number[] {
  const award: number[] = Array.from({ length: playerCount }, () => 0);
  const net = netScoresForHole(
    hole.scores,
    holeIndex,
    ctx.handicap,
    ctx.course,
  );
  const numA = teamNumber(net, teams.teamA);
  const numB = teamNumber(net, teams.teamB);
  if (numA === numB) return award;
  const winners = numA < numB ? teams.teamA : teams.teamB;
  const losers = numA < numB ? teams.teamB : teams.teamA;
  const diff = Math.abs(numA - numB);
  for (const i of winners) award[i] = diff;
  for (const i of losers) award[i] = -diff;
  return award;
}

export function holeOutcome(
  hole: VegasHole,
  teams: VegasTeams,
  playerCount: number,
  holeIndex = 0,
  ctx: VegasScoringContext = NO_CTX,
): VegasHoleOutcome {
  const net = netScoresForHole(
    hole.scores,
    holeIndex,
    ctx.handicap,
    ctx.course,
  );
  const numberA = teamNumber(net, teams.teamA);
  const numberB = teamNumber(net, teams.teamB);
  let winner: "A" | "B" | "tie" = "tie";
  if (numberA < numberB) winner = "A";
  else if (numberB < numberA) winner = "B";
  return {
    numberA,
    numberB,
    diff: Math.abs(numberA - numberB),
    winner,
    award: awardHole(hole, teams, playerCount, holeIndex, ctx),
  };
}

export function applyHole(
  players: VegasPlayer[],
  hole: VegasHole,
  teams: VegasTeams,
  holeIndex = 0,
  ctx: VegasScoringContext = NO_CTX,
): VegasPlayer[] {
  const award = awardHole(hole, teams, players.length, holeIndex, ctx);
  return players.map((p, i) => ({ ...p, points: p.points + award[i] }));
}

export function recompute(
  initial: VegasPlayer[],
  teams: VegasTeams,
  holes: VegasHole[],
  ctx: VegasScoringContext = NO_CTX,
): VegasPlayer[] {
  return holes.reduce<VegasPlayer[]>(
    (acc, h, idx) => applyHole(acc, h, teams, idx, ctx),
    initial,
  );
}

export function resetPlayers(players: VegasPlayer[]): VegasPlayer[] {
  return players.map((p) => ({ ...p, points: 0 }));
}

export function makeInitialPlayers(names: string[]): VegasPlayer[] {
  return names.map((name, i) => ({
    id: makeId(i),
    name,
    points: 0,
  }));
}

export type VegasStandings = {
  sorted: VegasPlayer[];
  winner: VegasPlayer;
  coWinners: VegasPlayer[];
  tied: boolean;
};

export function finalStandings(players: VegasPlayer[]): VegasStandings {
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

/** Build VegasTeams from teamA's two indices (teamB = the other two). */
export function teamsFromAssignment(teamA: [number, number]): VegasTeams {
  const all = [0, 1, 2, 3];
  const others = all.filter((i) => i !== teamA[0] && i !== teamA[1]);
  return {
    teamA,
    teamB: [others[0], others[1]] as [number, number],
  };
}

export function teamsAreValid(teams: VegasTeams): boolean {
  const a = new Set(teams.teamA);
  const b = new Set(teams.teamB);
  if (a.size !== 2 || b.size !== 2) return false;
  for (const i of teams.teamA) if (b.has(i)) return false;
  for (const i of [...teams.teamA, ...teams.teamB]) {
    if (i < 0 || i >= VEGAS_PLAYER_COUNT) return false;
  }
  return true;
}

class VegasEngineImpl extends GameEngine<
  VegasState,
  VegasHole,
  VegasPlayer,
  VegasStartOptions
> {
  readonly mode = "vegas" as const;
  readonly storageKey = VEGAS_STORAGE_KEY;
  readonly totalHoles = VEGAS_TOTAL_HOLES;
  readonly minPlayers = VEGAS_PLAYER_COUNT;
  readonly maxPlayers = VEGAS_PLAYER_COUNT;

  createInitialState(
    names: string[],
    options: VegasStartOptions = DEFAULT_VEGAS_TEAMS,
  ): VegasState | null {
    if (names.length !== VEGAS_PLAYER_COUNT) return null;
    const teams: VegasTeams = { teamA: options.teamA, teamB: options.teamB };
    const t = teamsAreValid(teams) ? teams : DEFAULT_VEGAS_TEAMS;
    return {
      mode: "vegas",
      players: makeInitialPlayers(this.trimNames(names)),
      teams: t,
      holes: [],
      handicap: options.handicap,
    };
  }

  validateHole(state: VegasState, hole: VegasHole): boolean {
    if (!hole || !Array.isArray(hole.scores)) return false;
    if (hole.scores.length !== state.players.length) return false;
    return hole.scores.every((s) => Number.isInteger(s) && s > 0);
  }

  applyHole(state: VegasState, hole: VegasHole): VegasState {
    return {
      ...state,
      players: applyHole(
        state.players,
        hole,
        state.teams,
        state.holes.length,
        ctxFromState(state),
      ),
      holes: [...state.holes, hole],
    };
  }

  recompute(state: VegasState): VegasState {
    return {
      ...state,
      players: recompute(
        resetPlayers(state.players),
        state.teams,
        state.holes,
        ctxFromState(state),
      ),
    };
  }

  parseState(raw: unknown): VegasState | null {
    return vegasStorage.parse(raw);
  }
}

export const vegasEngine: VegasEngineImpl = new VegasEngineImpl();

function makeId(i: number): string {
  const g: { crypto?: { randomUUID?: () => string } } =
    typeof globalThis === "undefined" ? {} : globalThis;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `v-${String(i)}-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`;
}
