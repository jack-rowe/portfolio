import { describe, expect, it } from "vitest";
import {
  BLIND_LOSE_POINTS,
  BLIND_WIN_POINTS,
  LONE_LOSE_POINTS,
  LONE_WIN_POINTS,
  PARTNER_LOSE_POINTS,
  PARTNER_WIN_POINTS,
  applyHole,
  awardHole,
  decisionIsValid,
  finalStandings,
  holeOutcome,
  makeInitialPlayers,
  recompute,
  resetPlayers,
  teamsFor,
  wolfFor,
} from "./engine";
import type { WolfHole, WolfPlayer } from "./types";

const NAMES = ["A", "B", "C", "D"];

function fresh(): WolfPlayer[] {
  return makeInitialPlayers(NAMES);
}

function partnerHole(scores: number[], partnerIndex: number): WolfHole {
  return { scores, decision: { kind: "partner", partnerIndex } };
}
function loneHole(scores: number[], blind = false): WolfHole {
  return { scores, decision: { kind: "lone", blind } };
}

describe("wolfFor", () => {
  it("rotates Wolf each hole", () => {
    expect(wolfFor(0, 4)).toBe(0);
    expect(wolfFor(1, 4)).toBe(1);
    expect(wolfFor(3, 4)).toBe(3);
    expect(wolfFor(4, 4)).toBe(0);
    expect(wolfFor(17, 4)).toBe(1);
  });
});

describe("teamsFor", () => {
  it("partner builds 2v2", () => {
    const t = teamsFor({ kind: "partner", partnerIndex: 2 }, 0, 4);
    expect(t.wolfTeam.sort()).toEqual([0, 2]);
    expect(t.oppTeam.sort()).toEqual([1, 3]);
  });
  it("lone builds 1v3", () => {
    const t = teamsFor({ kind: "lone", blind: false }, 1, 4);
    expect(t.wolfTeam).toEqual([1]);
    expect(t.oppTeam.sort()).toEqual([0, 2, 3]);
  });
});

describe("awardHole", () => {
  it("partner team wins (best ball)", () => {
    // Wolf=0, partner=2. Team scores: min(4,3)=3 vs min(5,5)=5. Wolf team wins.
    const award = awardHole(partnerHole([4, 5, 3, 5], 2), 0, 4);
    expect(award).toEqual([PARTNER_WIN_POINTS, 0, PARTNER_WIN_POINTS, 0]);
  });
  it("partner team loses", () => {
    const award = awardHole(partnerHole([6, 4, 5, 4], 2), 0, 4);
    expect(award).toEqual([0, PARTNER_LOSE_POINTS, 0, PARTNER_LOSE_POINTS]);
  });
  it("partner tie pays nobody", () => {
    const award = awardHole(partnerHole([4, 5, 5, 4], 2), 0, 4);
    expect(award).toEqual([0, 0, 0, 0]);
  });
  it("lone wolf wins", () => {
    // Wolf=1 alone. 1 has 3, others min=4. Wolf wins.
    const award = awardHole(loneHole([4, 3, 5, 4]), 1, 4);
    expect(award).toEqual([0, LONE_WIN_POINTS, 0, 0]);
  });
  it("lone wolf loses pays each opponent", () => {
    const award = awardHole(loneHole([3, 5, 4, 3]), 1, 4);
    expect(award).toEqual([
      LONE_LOSE_POINTS,
      0,
      LONE_LOSE_POINTS,
      LONE_LOSE_POINTS,
    ]);
  });
  it("blind wolf wins big", () => {
    const award = awardHole(loneHole([4, 3, 5, 4], true), 1, 4);
    expect(award).toEqual([0, BLIND_WIN_POINTS, 0, 0]);
  });
  it("blind wolf loses big", () => {
    const award = awardHole(loneHole([3, 5, 4, 3], true), 1, 4);
    expect(award).toEqual([
      BLIND_LOSE_POINTS,
      0,
      BLIND_LOSE_POINTS,
      BLIND_LOSE_POINTS,
    ]);
  });
});

describe("applyHole / recompute", () => {
  it("is pure (does not mutate)", () => {
    const before = fresh();
    const snap = JSON.stringify(before);
    applyHole(before, partnerHole([4, 5, 3, 5], 2), 0);
    expect(JSON.stringify(before)).toBe(snap);
  });
  it("recompute equals iterative apply", () => {
    const players = fresh();
    const holes: WolfHole[] = [
      partnerHole([4, 5, 3, 5], 2),
      loneHole([5, 4, 5, 5]),
      partnerHole([6, 5, 4, 4], 3),
      loneHole([3, 4, 5, 6], true),
    ];
    let iter = players;
    holes.forEach((h, i) => {
      iter = applyHole(iter, h, i);
    });
    expect(recompute(players, holes)).toEqual(iter);
  });
  it("hole 0 wolf is player 0; hole 1 wolf is player 1", () => {
    const players = fresh();
    // Hole 0: wolf=0 partners with 2, team wins -> 0 and 2 each get PARTNER_WIN_POINTS.
    const after0 = applyHole(players, partnerHole([4, 5, 3, 5], 2), 0);
    expect(after0[0].points).toBe(PARTNER_WIN_POINTS);
    expect(after0[2].points).toBe(PARTNER_WIN_POINTS);
    expect(after0[1].points).toBe(0);
    expect(after0[3].points).toBe(0);
    // Hole 1: wolf=1 lone, wolf wins -> only player 1 gets LONE_WIN_POINTS.
    const after1 = applyHole(after0, loneHole([4, 3, 5, 4]), 1);
    expect(after1[1].points).toBe(LONE_WIN_POINTS);
    expect(after1[0].points).toBe(after0[0].points);
  });
});

describe("holeOutcome", () => {
  it("reports result and award", () => {
    const o = holeOutcome(partnerHole([4, 5, 3, 5], 2), 0, 4);
    expect(o.wolfIndex).toBe(0);
    expect(o.wolfTeam.sort()).toEqual([0, 2]);
    expect(o.oppTeam.sort()).toEqual([1, 3]);
    expect(o.result).toBe("wolf");
    expect(o.wolfBest).toBe(3);
    expect(o.oppBest).toBe(5);
  });
  it("reports tie", () => {
    const o = holeOutcome(partnerHole([4, 5, 5, 4], 2), 0, 4);
    expect(o.result).toBe("tie");
    expect(o.award).toEqual([0, 0, 0, 0]);
  });
});

describe("resetPlayers", () => {
  it("zeroes points, preserves identity", () => {
    const players = fresh().map((p) => ({ ...p, points: 5 }));
    const r = resetPlayers(players);
    expect(r.every((p) => p.points === 0)).toBe(true);
    expect(r.map((p) => p.id)).toEqual(players.map((p) => p.id));
    expect(r.map((p) => p.name)).toEqual(players.map((p) => p.name));
  });
});

describe("finalStandings", () => {
  it("flags ties", () => {
    const players: WolfPlayer[] = NAMES.map((n, i) => ({
      id: `id-${String(i)}`,
      name: n,
      points: i === 0 || i === 1 ? 6 : 2,
    }));
    const s = finalStandings(players);
    expect(s.tied).toBe(true);
    expect(s.coWinners.map((p) => p.name).sort()).toEqual(["A", "B"]);
  });
  it("sorts descending by points", () => {
    const players: WolfPlayer[] = NAMES.map((n, i) => ({
      id: `id-${String(i)}`,
      name: n,
      points: [3, 7, 1, 5][i],
    }));
    expect(finalStandings(players).sorted.map((p) => p.points)).toEqual([
      7, 5, 3, 1,
    ]);
  });
});

describe("decisionIsValid", () => {
  it("rejects wrong player count", () => {
    expect(decisionIsValid({ kind: "lone", blind: false }, 0, 3)).toBe(false);
  });
  it("accepts lone wolf", () => {
    expect(decisionIsValid({ kind: "lone", blind: true }, 0, 4)).toBe(true);
  });
  it("rejects partner equal to wolf", () => {
    expect(decisionIsValid({ kind: "partner", partnerIndex: 1 }, 1, 4)).toBe(
      false,
    );
  });
  it("accepts valid partner", () => {
    expect(decisionIsValid({ kind: "partner", partnerIndex: 2 }, 0, 4)).toBe(
      true,
    );
  });
});
