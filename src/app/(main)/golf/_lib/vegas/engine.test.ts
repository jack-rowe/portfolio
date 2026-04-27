import { describe, expect, test } from "vitest";
import {
  applyHole,
  awardHole,
  finalStandings,
  makeInitialPlayers,
  recompute,
  resetPlayers,
  teamNumber,
  teamsAreValid,
  teamsFromAssignment,
} from "./engine";
import type { VegasHole, VegasTeams } from "./types";
import { DEFAULT_VEGAS_TEAMS, VEGAS_PLAYER_COUNT } from "./types";

const teams: VegasTeams = DEFAULT_VEGAS_TEAMS;

function hole(scores: number[]): VegasHole {
  return { scores };
}

describe("vegas/teamNumber", () => {
  test("low first, high second", () => {
    expect(teamNumber([3, 5, 4, 6], [0, 1])).toBe(35);
    expect(teamNumber([3, 5, 4, 6], [2, 3])).toBe(46);
  });
  test("equal scores produce repeated digits", () => {
    expect(teamNumber([4, 4, 0, 0], [0, 1])).toBe(44);
  });
  test("double-digit second score yields 3 digits", () => {
    expect(teamNumber([4, 11, 0, 0], [0, 1])).toBe(411);
  });
});

describe("vegas/awardHole", () => {
  test("team A wins gives +diff to A, -diff to B", () => {
    const a = awardHole(hole([3, 5, 4, 6]), teams, VEGAS_PLAYER_COUNT);
    expect(a).toEqual([11, 11, -11, -11]);
  });
  test("team B wins gives -diff to A, +diff to B", () => {
    const a = awardHole(hole([6, 8, 3, 4]), teams, VEGAS_PLAYER_COUNT);
    expect(a).toEqual([-34, -34, 34, 34]);
  });
  test("tie produces zeroes", () => {
    const a = awardHole(hole([3, 5, 3, 5]), teams, VEGAS_PLAYER_COUNT);
    expect(a).toEqual([0, 0, 0, 0]);
  });
});

describe("vegas/applyHole + recompute", () => {
  test("applyHole is pure", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    const before = players.map((p) => p.points);
    applyHole(players, hole([3, 5, 4, 6]), teams);
    expect(players.map((p) => p.points)).toEqual(before);
  });

  test("recompute equals iterative apply", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    const holes = [hole([3, 5, 4, 6]), hole([4, 4, 5, 5]), hole([6, 8, 3, 4])];
    const a = recompute(players, teams, holes);
    let b = players;
    for (const h of holes) b = applyHole(b, h, teams);
    expect(a.map((p) => p.points)).toEqual(b.map((p) => p.points));
  });

  test("net points sum to zero", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    const holes = [hole([3, 5, 4, 6]), hole([6, 8, 3, 4])];
    const after = recompute(players, teams, holes);
    expect(after.reduce((sum, p) => sum + p.points, 0)).toBe(0);
  });
});

describe("vegas/resetPlayers + finalStandings", () => {
  test("resetPlayers zeroes points", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]).map((p, i) => ({
      ...p,
      points: i,
    }));
    expect(resetPlayers(players).every((p) => p.points === 0)).toBe(true);
  });

  test("finalStandings detects ties", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]).map((p, i) => ({
      ...p,
      points: i < 2 ? 10 : -10,
    }));
    const s = finalStandings(players);
    expect(s.tied).toBe(true);
    expect(s.coWinners).toHaveLength(2);
  });
});

describe("vegas/teamsFromAssignment", () => {
  test("infers teamB from teamA", () => {
    expect(teamsFromAssignment([0, 2])).toEqual({
      teamA: [0, 2],
      teamB: [1, 3],
    });
  });
  test("teamsAreValid catches duplicates", () => {
    expect(teamsAreValid({ teamA: [0, 0], teamB: [1, 2] })).toBe(false);
    expect(teamsAreValid({ teamA: [0, 1], teamB: [1, 2] })).toBe(false);
    expect(teamsAreValid({ teamA: [0, 1], teamB: [2, 3] })).toBe(true);
  });
});
