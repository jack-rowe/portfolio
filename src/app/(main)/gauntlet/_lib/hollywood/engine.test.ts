import { describe, expect, test } from "vitest";
import {
  applyHole,
  finalStandings,
  holeOutcome,
  makeInitialPlayers,
  pairsForHole,
  recompute,
  segmentOf,
  segmentScores,
  SEGMENTS,
} from "./engine";
import type { HollywoodHole } from "./types";
import { HOLLYWOOD_PLAYER_COUNT, HOLLYWOOD_SEGMENT_HOLES } from "./types";

function hole(scores: number[]): HollywoodHole {
  return { scores };
}

describe("hollywood/segmentOf + pairsForHole", () => {
  test("hole 1 → segment 0", () => {
    expect(segmentOf(0)).toBe(0);
    expect(pairsForHole(0)).toEqual(SEGMENTS[0]);
  });
  test("hole 6 → segment 0, hole 7 → segment 1", () => {
    expect(segmentOf(HOLLYWOOD_SEGMENT_HOLES - 1)).toBe(0);
    expect(segmentOf(HOLLYWOOD_SEGMENT_HOLES)).toBe(1);
  });
  test("hole 13 → segment 2", () => {
    expect(segmentOf(HOLLYWOOD_SEGMENT_HOLES * 2)).toBe(2);
  });
  test("each player partners with each other player exactly once", () => {
    const partnerCounts = new Map<string, number>();
    for (const seg of SEGMENTS) {
      for (const team of [seg.teamA, seg.teamB]) {
        const key = [...team].sort((a, b) => a - b).join("-");
        partnerCounts.set(key, (partnerCounts.get(key) ?? 0) + 1);
      }
    }
    for (const v of partnerCounts.values()) expect(v).toBe(1);
  });
});

describe("hollywood/holeOutcome", () => {
  test("segment 0 — team A best ball wins", () => {
    const out = holeOutcome(hole([3, 6, 5, 5]), 0, HOLLYWOOD_PLAYER_COUNT);
    expect(out.winner).toBe("A");
    expect(out.award).toEqual([1, 1, 0, 0]);
  });
  test("segment 1 — team B best ball wins", () => {
    const out = holeOutcome(
      hole([5, 3, 5, 2]),
      HOLLYWOOD_SEGMENT_HOLES,
      HOLLYWOOD_PLAYER_COUNT,
    );
    expect(out.winner).toBe("B");
    expect(out.award).toEqual([0, 1, 0, 1]);
  });
  test("tie produces zero award", () => {
    const out = holeOutcome(hole([3, 5, 3, 5]), 0, HOLLYWOOD_PLAYER_COUNT);
    expect(out.winner).toBe("tie");
    expect(out.award).toEqual([0, 0, 0, 0]);
  });
});

describe("hollywood/applyHole + recompute", () => {
  test("applyHole is pure", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    const before = players.map((p) => p.points);
    applyHole(players, hole([3, 6, 5, 5]), 0);
    expect(players.map((p) => p.points)).toEqual(before);
  });
  test("18 holes accumulate per-segment", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    // All 18 holes — team A wins every hole in seg 0, ties in seg 1+2
    const holes: HollywoodHole[] = [];
    for (let i = 0; i < HOLLYWOOD_SEGMENT_HOLES; i++) {
      holes.push(hole([3, 4, 5, 6]));
    }
    for (let i = 0; i < HOLLYWOOD_SEGMENT_HOLES * 2; i++) {
      holes.push(hole([4, 4, 4, 4]));
    }
    const after = recompute(players, holes);
    // Seg 0 teamA = [0,1] won 6 holes, others 0
    expect(after[0].points).toBe(HOLLYWOOD_SEGMENT_HOLES);
    expect(after[1].points).toBe(HOLLYWOOD_SEGMENT_HOLES);
    expect(after[2].points).toBe(0);
    expect(after[3].points).toBe(0);
  });
});

describe("hollywood/segmentScores", () => {
  test("counts wins per segment", () => {
    const holes: HollywoodHole[] = [];
    // seg 0: teamA wins 4, teamB wins 1, tie 1
    for (let i = 0; i < 4; i++) holes.push(hole([3, 4, 5, 6]));
    holes.push(hole([5, 6, 3, 4]));
    holes.push(hole([3, 4, 3, 4]));
    const segs = segmentScores(holes);
    expect(segs[0].teamAWins).toBe(4);
    expect(segs[0].teamBWins).toBe(1);
    expect(segs[0].ties).toBe(1);
    expect(segs[0].winner).toBe("A");
  });
});

describe("hollywood/finalStandings", () => {
  test("ties detected", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]).map((p, i) => ({
      ...p,
      points: i < 2 ? 5 : 3,
    }));
    const s = finalStandings(players);
    expect(s.tied).toBe(true);
    expect(s.coWinners).toHaveLength(2);
  });
});
