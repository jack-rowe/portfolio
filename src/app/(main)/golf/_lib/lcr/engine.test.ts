import { describe, expect, test } from "vitest";
import {
  applyHole,
  awardHole,
  finalStandings,
  holeOutcome,
  makeInitialPlayers,
  outsideIndices,
  recompute,
  resetPlayers,
} from "./engine";
import type { LcrHole } from "./types";
import {
  LCR_CENTER_WIN_POINTS,
  LCR_OUTSIDE_WIN_POINTS,
  LCR_PLAYER_COUNT,
} from "./types";

function hole(scores: number[], centerIndex: number): LcrHole {
  return { scores, centerIndex };
}

describe("lcr/outsideIndices", () => {
  test("outside indices exclude center", () => {
    expect(outsideIndices(0, LCR_PLAYER_COUNT)).toEqual([1, 2]);
    expect(outsideIndices(1, LCR_PLAYER_COUNT)).toEqual([0, 2]);
    expect(outsideIndices(2, LCR_PLAYER_COUNT)).toEqual([0, 1]);
  });
});

describe("lcr/holeOutcome", () => {
  test("center wins solo: +2 to center, 0 to outside", () => {
    const out = holeOutcome(hole([3, 5, 5], 0), LCR_PLAYER_COUNT);
    expect(out.winner).toBe("center");
    expect(out.award).toEqual([LCR_CENTER_WIN_POINTS, 0, 0]);
  });
  test("outside wins best-ball: +1 to each outside player", () => {
    const out = holeOutcome(hole([5, 3, 6], 0), LCR_PLAYER_COUNT);
    expect(out.winner).toBe("outside");
    expect(out.award).toEqual([
      0,
      LCR_OUTSIDE_WIN_POINTS,
      LCR_OUTSIDE_WIN_POINTS,
    ]);
  });
  test("tie is a wash", () => {
    const out = holeOutcome(hole([4, 4, 5], 0), LCR_PLAYER_COUNT);
    expect(out.winner).toBe("tie");
    expect(out.award).toEqual([0, 0, 0]);
  });
  test("center can be any player", () => {
    // Center=index 1; player 1 shoots 3, others [5,5]
    const out = holeOutcome(hole([5, 3, 5], 1), LCR_PLAYER_COUNT);
    expect(out.winner).toBe("center");
    expect(out.centerIndex).toBe(1);
    expect(out.award).toEqual([0, LCR_CENTER_WIN_POINTS, 0]);
  });
  test("outside best ball is the lower of the two outside scores", () => {
    // Center=0 score 4, outside=[6,5] best=5, center wins
    const out = holeOutcome(hole([4, 6, 5], 0), LCR_PLAYER_COUNT);
    expect(out.outsideBest).toBe(5);
    expect(out.winner).toBe("center");
  });
});

describe("lcr/applyHole + recompute", () => {
  test("applyHole is pure", () => {
    const players = makeInitialPlayers(["A", "B", "C"]);
    const before = players.map((p) => p.points);
    applyHole(players, hole([3, 5, 5], 0));
    expect(players.map((p) => p.points)).toEqual(before);
  });
  test("recompute folds across holes with varying centers", () => {
    const players = makeInitialPlayers(["A", "B", "C"]);
    const holes: LcrHole[] = [
      hole([3, 5, 5], 0), // center A wins +2
      hole([5, 3, 5], 1), // center B wins +2
      hole([5, 5, 3], 2), // center C wins +2
    ];
    const after = recompute(players, holes);
    expect(after[0].points).toBe(LCR_CENTER_WIN_POINTS);
    expect(after[1].points).toBe(LCR_CENTER_WIN_POINTS);
    expect(after[2].points).toBe(LCR_CENTER_WIN_POINTS);
  });
  test("outside wins distribute across both teammates", () => {
    const players = makeInitialPlayers(["A", "B", "C"]);
    // center A=5, outside [B=3, C=5] best=3 → outside wins, B&C +1 each
    const after = applyHole(players, hole([5, 3, 5], 0));
    expect(after[0].points).toBe(0);
    expect(after[1].points).toBe(LCR_OUTSIDE_WIN_POINTS);
    expect(after[2].points).toBe(LCR_OUTSIDE_WIN_POINTS);
  });
  test("award equals awardHole helper", () => {
    const h = hole([4, 6, 5], 0);
    expect(holeOutcome(h, LCR_PLAYER_COUNT).award).toEqual(
      awardHole(h, LCR_PLAYER_COUNT),
    );
  });
});

describe("lcr/resetPlayers", () => {
  test("zeros points", () => {
    const players = makeInitialPlayers(["A", "B", "C"]).map((p) => ({
      ...p,
      points: LCR_CENTER_WIN_POINTS,
    }));
    const reset = resetPlayers(players);
    expect(reset.every((p) => p.points === 0)).toBe(true);
  });
});

describe("lcr/finalStandings", () => {
  test("identifies single winner", () => {
    const players = makeInitialPlayers(["A", "B", "C"]);
    players[0].points = 4;
    players[1].points = LCR_CENTER_WIN_POINTS;
    players[2].points = LCR_OUTSIDE_WIN_POINTS;
    const r = finalStandings(players);
    expect(r.tied).toBe(false);
    expect(r.winner.name).toBe("A");
    expect(r.coWinners).toHaveLength(1);
  });
  test("identifies ties", () => {
    const players = makeInitialPlayers(["A", "B", "C"]);
    players[0].points = LCR_CENTER_WIN_POINTS;
    players[1].points = LCR_CENTER_WIN_POINTS;
    players[2].points = LCR_OUTSIDE_WIN_POINTS;
    const r = finalStandings(players);
    expect(r.tied).toBe(true);
    expect(r.coWinners).toHaveLength(2);
  });
});
