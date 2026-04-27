import { describe, expect, test } from "vitest";
import {
  applyHole,
  finalStandings,
  holeOutcome,
  makeInitialPlayers,
  recompute,
  resetPlayers,
} from "./engine";
import type { MatchplayHole } from "./types";

function hole(scores: number[]): MatchplayHole {
  return { scores };
}

describe("matchplay/holeOutcome", () => {
  test("unique low scores +1 for that player", () => {
    const out = holeOutcome(hole([3, 5, 4, 6]), 4);
    expect(out.result).toBe("win");
    expect(out.bestPlayers).toEqual([0]);
    expect(out.award).toEqual([1, 0, 0, 0]);
  });
  test("tie at the low halves the hole", () => {
    const out = holeOutcome(hole([3, 3, 5, 6]), 4);
    expect(out.result).toBe("halve");
    expect(out.bestPlayers).toEqual([0, 1]);
    expect(out.award).toEqual([0, 0, 0, 0]);
  });
  test("works with 2 players", () => {
    const out = holeOutcome(hole([3, 5]), 2);
    expect(out.award).toEqual([1, 0]);
  });
  test("works with 3 players", () => {
    const out = holeOutcome(hole([5, 4, 5]), 3);
    expect(out.award).toEqual([0, 1, 0]);
  });
});

describe("matchplay/applyHole + recompute", () => {
  test("applyHole is pure", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    const before = players.map((p) => p.points);
    applyHole(players, hole([3, 5, 4, 6]));
    expect(players.map((p) => p.points)).toEqual(before);
  });
  test("recompute equals iterative applyHole", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    const holes = [hole([3, 5, 4, 6]), hole([5, 3, 4, 4]), hole([4, 4, 4, 4])];
    const iterative = holes.reduce((acc, h) => applyHole(acc, h), players);
    expect(recompute(players, holes)).toEqual(iterative);
  });
  test("accumulates wins correctly", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    const holes = [
      hole([3, 5, 4, 6]), // A
      hole([5, 3, 4, 4]), // B
      hole([4, 4, 4, 4]), // halve
      hole([5, 5, 3, 5]), // C
      hole([5, 5, 5, 4]), // D
    ];
    const after = recompute(players, holes);
    expect(after[0].points).toBe(1);
    expect(after[1].points).toBe(1);
    expect(after[2].points).toBe(1);
    expect(after[3].points).toBe(1);
  });
});

describe("matchplay/resetPlayers", () => {
  test("zeros points", () => {
    const players = makeInitialPlayers(["A", "B"]).map((p) => ({
      ...p,
      points: 4,
    }));
    const reset = resetPlayers(players);
    expect(reset.every((p) => p.points === 0)).toBe(true);
  });
});

describe("matchplay/finalStandings", () => {
  test("single winner", () => {
    const players = makeInitialPlayers(["A", "B", "C"]);
    players[0].points = 5;
    players[1].points = 3;
    players[2].points = 2;
    const r = finalStandings(players);
    expect(r.tied).toBe(false);
    expect(r.winner.name).toBe("A");
  });
  test("multiway tie", () => {
    const players = makeInitialPlayers(["A", "B", "C"]);
    players[0].points = 4;
    players[1].points = 4;
    players[2].points = 4;
    const r = finalStandings(players);
    expect(r.tied).toBe(true);
    expect(r.coWinners).toHaveLength(3);
  });
});
