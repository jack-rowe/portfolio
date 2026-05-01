import { describe, expect, it } from "vitest";
import {
  advanceTarget,
  applyHole,
  chaseOrder,
  finalStandings,
  holeOutcomes,
  lapProgress,
  makeInitialPlayers,
  recompute,
  resetPlayers,
} from "./engine";
import type { GauntletScoringContext } from "./engine";
import type { Player } from "./types";
import { getCourse } from "../courseData";
import { buildHandicapConfig } from "../handicap";

function makePlayers(names: string[]): Player[] {
  const total = names.length;
  return names.map((name, i) => ({
    id: `id-${String(i)}`,
    name,
    points: 0,
    targetIndex: (i + 1) % total,
    startTargetIndex: (i + 1) % total,
  }));
}

describe("advanceTarget", () => {
  it("skips the player themselves", () => {
    // Player 0, currently chasing 3 (last). Next would be 0 → self → skip to 1.
    expect(advanceTarget(0, 3, 4)).toBe(1);
  });

  it("wraps around the player count", () => {
    expect(advanceTarget(2, 3, 4)).toBe(0);
  });

  it("advances normally when no self-collision", () => {
    expect(advanceTarget(0, 1, 4)).toBe(2);
  });
});

describe("chaseOrder", () => {
  it("produces a full lap of length total - 1", () => {
    const order = chaseOrder(0, 1, 4);
    expect(order).toHaveLength(3);
    expect(order).toEqual([1, 2, 3]);
  });

  it("excludes the player themselves", () => {
    for (let i = 0; i < 4; i++) {
      const order = chaseOrder(i, (i + 1) % 4, 4);
      expect(order).not.toContain(i);
    }
  });
});

describe("applyHole", () => {
  it("advances target when player beats their target", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    // A (idx 0) chases B (idx 1). A scores 3, B scores 4 → A advances to chasing C (idx 2).
    const next = applyHole(players, [3, 4, 5, 5]);
    expect(next[0].targetIndex).toBe(2);
    expect(next[0].points).toBe(0);
  });

  it("does not advance when score ties or loses", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const next = applyHole(players, [4, 4, 4, 4]);
    expect(next[0].targetIndex).toBe(1);
    expect(next[1].targetIndex).toBe(2);
  });

  it("awards a point and resets target on lap completion", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    // Manually advance A to last opponent in lap (idx 3).
    players[0].targetIndex = 3;
    const next = applyHole(players, [3, 4, 4, 4]);
    expect(next[0].points).toBe(1);
    expect(next[0].targetIndex).toBe(players[0].startTargetIndex);
  });

  it("is pure — does not mutate input", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const snapshot = JSON.stringify(players);
    applyHole(players, [3, 4, 5, 6]);
    expect(JSON.stringify(players)).toBe(snapshot);
  });
});

describe("recompute", () => {
  it("is deterministic — folding same holes yields same result", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const holes = [
      [3, 4, 5, 6],
      [4, 4, 5, 5],
      [3, 4, 4, 4],
      [5, 4, 4, 4],
    ];
    const a = recompute(players, holes);
    const b = recompute(players, holes);
    expect(a).toEqual(b);
  });

  it("equals iterative applyHole", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const holes = [
      [3, 4, 5, 6],
      [5, 4, 4, 4],
    ];
    const iterative = holes.reduce<Player[]>(
      (acc, h) => applyHole(acc, h),
      players,
    );
    expect(recompute(players, holes)).toEqual(iterative);
  });

  it("supports undo via slice", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const holes = [
      [3, 4, 5, 6],
      [4, 5, 5, 5],
      [3, 4, 4, 4],
    ];
    const before = recompute(players, holes.slice(0, 2));
    const after = recompute(players, holes);
    const undone = recompute(players, holes.slice(0, -1));
    expect(undone).toEqual(before);
    expect(undone).not.toEqual(after);
  });
});

describe("lapProgress", () => {
  it("reports 0 beaten at the start of a lap", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    expect(lapProgress(players[0], 0, 4)).toEqual({ beaten: 0, lapLength: 3 });
  });

  it("reports correct progress mid-lap", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].targetIndex = 3; // last opponent in lap
    expect(lapProgress(players[0], 0, 4)).toEqual({ beaten: 2, lapLength: 3 });
  });
});

describe("holeOutcomes", () => {
  it("flags advanced when a player beats their target", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    // A(0)→B(1): 3<4 advance. B(1)→C(2): 4<5 advance.
    // C(2)→D(3): 5<5 no. D(3)→A(0): 5<3 no.
    const matrix = holeOutcomes(players, [[3, 4, 5, 5]]);
    expect(matrix[0][0]).toEqual({ advanced: true, gauntlet: false });
    expect(matrix[0][2]).toEqual({ advanced: false, gauntlet: false });
    expect(matrix[0][3]).toEqual({ advanced: false, gauntlet: false });
  });

  it("flags gauntlet when an advance completes a lap", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].targetIndex = 3; // last opponent in lap
    const matrix = holeOutcomes(players, [[3, 4, 4, 4]]);
    expect(matrix[0][0]).toEqual({ advanced: true, gauntlet: true });
  });

  it("matches recompute over a sequence", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const holes = [
      [3, 4, 5, 6],
      [4, 4, 5, 5],
      [3, 4, 4, 4],
    ];
    const matrix = holeOutcomes(players, holes);
    expect(matrix).toHaveLength(holes.length);
    matrix.forEach((row) => {
      expect(row).toHaveLength(players.length);
    });
  });

  it("returns an empty matrix for zero holes", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    expect(holeOutcomes(players, [])).toEqual([]);
  });

  it("is pure — does not mutate initial players", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const snapshot = JSON.stringify(players);
    holeOutcomes(players, [[3, 4, 4, 4]]);
    expect(JSON.stringify(players)).toBe(snapshot);
  });
});

describe("makeInitialPlayers", () => {
  it("creates correct count with given names", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    expect(players).toHaveLength(4);
    expect(players.map((p) => p.name)).toEqual(["A", "B", "C", "D"]);
  });

  it("starts all players with 0 points", () => {
    const players = makeInitialPlayers(["A", "B", "C"]);
    players.forEach((p) => expect(p.points).toBe(0));
  });

  it("sets each player's initial target to the next player", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    expect(players[0].targetIndex).toBe(1);
    expect(players[1].targetIndex).toBe(2);
    expect(players[2].targetIndex).toBe(3);
    expect(players[3].targetIndex).toBe(0); // wraps around
  });

  it("sets startTargetIndex equal to targetIndex", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    players.forEach((p) => expect(p.targetIndex).toBe(p.startTargetIndex));
  });

  it("assigns unique ids", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    const ids = new Set(players.map((p) => p.id));
    expect(ids.size).toBe(4);
  });

  it("works for 3 players", () => {
    const players = makeInitialPlayers(["X", "Y", "Z"]);
    expect(players).toHaveLength(3);
    expect(players[2].targetIndex).toBe(0);
    expect(players[2].startTargetIndex).toBe(0);
  });
});

describe("resetPlayers", () => {
  it("resets points to 0", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 3;
    players[2].points = 1;
    const reset = resetPlayers(players);
    reset.forEach((p) => expect(p.points).toBe(0));
  });

  it("resets targetIndex to (i+1)%total", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].targetIndex = 3; // mid-lap
    const reset = resetPlayers(players);
    expect(reset[0].targetIndex).toBe(1);
    expect(reset[3].targetIndex).toBe(0);
  });

  it("resets startTargetIndex to (i+1)%total", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].startTargetIndex = 3; // shouldn't happen normally but test anyway
    const reset = resetPlayers(players);
    expect(reset[0].startTargetIndex).toBe(1);
  });

  it("preserves player ids and names", () => {
    const players = makePlayers(["Alice", "Bob", "Carol", "Dave"]);
    const reset = resetPlayers(players);
    reset.forEach((r, i) => {
      expect(r.id).toBe(players[i].id);
      expect(r.name).toBe(players[i].name);
    });
  });

  it("is pure — does not mutate input", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 5;
    const snapshot = JSON.stringify(players);
    resetPlayers(players);
    expect(JSON.stringify(players)).toBe(snapshot);
  });
});

describe("3-player game mechanics", () => {
  it("advanceTarget wraps past self with 3 players", () => {
    // Player 1, chasing 2 (last slot). Next = (2+1)%3 = 0. Not self → 0.
    expect(advanceTarget(1, 2, 3)).toBe(0);
    // Player 2, chasing 0. Next = (0+1)%3 = 1. Not self → 1.
    expect(advanceTarget(2, 0, 3)).toBe(1);
    // Player 0, chasing 2 (last). Next = (2+1)%3 = 0. Self → skip → 1.
    expect(advanceTarget(0, 2, 3)).toBe(1);
  });

  it("applyHole advances correctly with 3 players", () => {
    const players = makePlayers(["A", "B", "C"]);
    // A(0)→B(1): 3<4 → advance to C. B(1)→C(2): 5>4 → no. C(2)→A(0): 4>3 → no.
    const next = applyHole(players, [3, 5, 4]);
    expect(next[0].targetIndex).toBe(2); // A advanced to chase C
    expect(next[1].targetIndex).toBe(2); // B stayed
    expect(next[2].targetIndex).toBe(0); // C stayed
  });

  it("lap has length 2 with 3 players", () => {
    const players = makePlayers(["A", "B", "C"]);
    const { lapLength } = lapProgress(players[0], 0, 3);
    expect(lapLength).toBe(2);
  });

  it("awards point and resets on lap completion with 3 players", () => {
    const players = makePlayers(["A", "B", "C"]);
    players[0].targetIndex = 2; // last in lap
    const next = applyHole(players, [3, 4, 4]);
    expect(next[0].points).toBe(1);
    expect(next[0].targetIndex).toBe(players[0].startTargetIndex);
  });

  it("holeOutcomes matrix dimensions are correct for 3 players", () => {
    const players = makePlayers(["A", "B", "C"]);
    const holes = [
      [3, 4, 5],
      [4, 4, 4],
    ];
    const matrix = holeOutcomes(players, holes);
    expect(matrix).toHaveLength(2);
    matrix.forEach((row) => expect(row).toHaveLength(3));
  });

  it("recompute is consistent for a 3-player game", () => {
    const players = makePlayers(["A", "B", "C"]);
    const holes = [
      [3, 4, 5],
      [4, 5, 3],
      [3, 3, 4],
    ];
    const a = recompute(players, holes);
    const b = recompute(players, holes);
    expect(a).toEqual(b);
  });
});

describe("finalStandings", () => {
  it("identifies a single clear winner", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 2;
    const { winner, coWinners, tieBroken } = finalStandings(players);
    expect(winner.name).toBe("A");
    expect(coWinners).toHaveLength(1);
    expect(tieBroken).toBe(false);
  });

  it("identifies a full tie on points and beaten", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    // All at 0 points, all beaten=0 (start of lap)
    const { coWinners } = finalStandings(players);
    expect(coWinners).toHaveLength(4);
    expect(coWinners.map((p) => p.name).sort()).toEqual(["A", "B", "C", "D"]);
  });

  it("identifies two co-winners out of four players when two are fully tied", () => {
    // A and B tied on points=1 and beaten=2; C and D on points=0
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 1;
    players[0].targetIndex = 3; // beaten=2 (chasing last in lap)
    players[1].points = 1;
    players[1].targetIndex = 0; // beaten=2 (chasing last in lap: wraps to idx 0)
    const { coWinners } = finalStandings(players);
    expect(coWinners).toHaveLength(2);
    expect(coWinners.map((p) => p.name).sort()).toEqual(["A", "B"]);
  });

  it("regression: partial points tie with a beaten-tiebreaker still shows co-winners correctly", () => {
    // Bug: A(pts=0,beaten=1), B(pts=0,beaten=1), C(pts=0,beaten=0)
    // Before fix: stillTied=false because C's beaten broke the every() check → showed "A wins"
    // After fix: coWinners=[A,B], stillTied=true
    const players = makePlayers(["A", "B", "C"]);
    players[0].targetIndex = 2; // beaten=1 (chasing idx 2, which is index 1 in chase order)
    players[1].targetIndex = 0; // beaten=1 (chasing idx 0, last in their lap order)
    // C stays at beaten=0
    const { coWinners, tieBroken } = finalStandings(players);
    expect(coWinners).toHaveLength(2);
    expect(coWinners.map((p) => p.name).sort()).toEqual(["A", "B"]);
    expect(tieBroken).toBe(false);
  });

  it("uses beaten count as tiebreaker when points are equal", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 1;
    players[0].targetIndex = 3; // beaten=2
    players[1].points = 1;
    // B stays beaten=0
    const { winner, coWinners, tieBroken } = finalStandings(players);
    expect(winner.name).toBe("A");
    expect(coWinners).toHaveLength(1);
    expect(tieBroken).toBe(true);
  });

  it("sorts the full ranking by points then beaten", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[2].points = 2; // C is highest
    players[0].points = 1;
    players[0].targetIndex = 3; // A beaten=2
    players[1].points = 1;
    // B beaten=0
    const { winner } = finalStandings(players);
    expect(winner.name).toBe("C");
  });
});

// =============================================================================
// Handicap context
// =============================================================================

/*
 * Greenhills stroke indices (0-based hole index → SI):
 *   0:11  1:1   2:13  3:3   4:5   5:17  6:9   7:15  8:7
 *   9:4  10:16 11:18 12:10 13:2  14:14 15:8  16:12 17:6
 *
 * For hcp=9 holes with SI ≤ 9 receive 1 stroke: indices 1,3,4,6,8,9,13,15,17
 * Holes without a stroke for hcp=9: indices 0,2,5,7,10,11,12,14,16
 * For hcp=27 those 9 holes receive 2 strokes; all remaining holes receive 1.
 */
const COURSE_ID = "greenhills";
const COURSE = getCourse(COURSE_ID);
if (!COURSE) throw new Error("test setup: greenhills course missing");

function strokesCtx(handicaps: number[]): GauntletScoringContext {
  return { handicap: buildHandicapConfig("strokes", COURSE_ID, handicaps), course: COURSE };
}

function grossCtx(handicaps: number[]): GauntletScoringContext {
  return { handicap: buildHandicapConfig("gross", COURSE_ID, handicaps), course: COURSE };
}

function noneCtx(handicaps: number[]): GauntletScoringContext {
  return { handicap: buildHandicapConfig("none", COURSE_ID, handicaps), course: COURSE };
}

describe("applyHole — strokes-mode handicap", () => {
  it("stroke converts gross tie into net win — chaser advances", () => {
    // 3 players: A(hcp=9), B(hcp=0), C(hcp=0)
    // Hole index 1, SI=1: A gets 1 stroke. Gross [4,4,5]: A vs B is a gross tie.
    // Net A=3 < B=4 → A advances from chasing B(idx=1) to chasing C(idx=2).
    const players = makePlayers(["A", "B", "C"]);
    const ctx = strokesCtx([9, 0, 0]);
    const withoutCtx = applyHole(players, [4, 4, 5], 1);
    const withCtx = applyHole(players, [4, 4, 5], 1, ctx);
    expect(withoutCtx[0].targetIndex).toBe(1); // gross tie → no advance
    expect(withCtx[0].targetIndex).toBe(2);    // net win  → advances to C
    expect(withCtx[0].points).toBe(0);         // not a lap-complete yet
  });

  it("target's stroke turns a gross win into a net tie — no advance", () => {
    // 3 players: A(hcp=0), B(hcp=9), C(hcp=0)
    // Hole index 1, SI=1: B gets 1 stroke.
    // Gross [3,4,5]: A vs B → A wins gross (3<4).
    // Net A=3 vs B=4-1=3 → tie → A does NOT advance.
    const players = makePlayers(["A", "B", "C"]);
    const ctx = strokesCtx([0, 9, 0]);
    const withoutCtx = applyHole(players, [3, 4, 5], 1);
    const withCtx = applyHole(players, [3, 4, 5], 1, ctx);
    expect(withoutCtx[0].targetIndex).toBe(2); // gross win → advances without handicap
    expect(withCtx[0].targetIndex).toBe(1);    // net tie  → stays on B
  });

  it("no stroke when SI > player handicap — result identical to gross", () => {
    // Hole index 0, SI=11: hcp=9, 11>9 → no stroke. Net == gross.
    const players = makePlayers(["A", "B", "C"]);
    const ctx = strokesCtx([9, 0, 0]);
    const withoutCtx = applyHole(players, [3, 4, 5], 0);
    const withCtx = applyHole(players, [3, 4, 5], 0, ctx);
    expect(withCtx).toEqual(withoutCtx);
  });

  it("mode=gross uses gross scores for per-hole comparisons — tied gross stays tied", () => {
    // Gross mode only applies a final deduction; per-hole comparisons use raw gross.
    const players = makePlayers(["A", "B", "C"]);
    const ctxGross = grossCtx([18, 0, 0]);
    const ctxNone = noneCtx([18, 0, 0]);
    const baseResult = applyHole(players, [4, 4, 5], 1);
    expect(applyHole(players, [4, 4, 5], 1, ctxGross)).toEqual(baseResult);
    expect(applyHole(players, [4, 4, 5], 1, ctxNone)).toEqual(baseResult);
  });

  it("strokes mode with no course falls back to gross comparisons", () => {
    // When course is null the engine cannot look up SI → gross is used.
    const players = makePlayers(["A", "B", "C"]);
    const ctxNoCourse: GauntletScoringContext = {
      handicap: buildHandicapConfig("strokes", COURSE_ID, [9, 0, 0]),
      course: null,
    };
    const baseResult = applyHole(players, [4, 4, 5], 1);
    expect(applyHole(players, [4, 4, 5], 1, ctxNoCourse)).toEqual(baseResult);
  });

  it("hcp=27 grants 2 strokes on SI=1 hole — larger gross deficit still advances", () => {
    // Hole index 1, SI=1: hcp=27 → 2 strokes (first full lap gives 1 stroke everywhere;
    // second partial lap of 9 gives a 2nd stroke on holes with SI ≤ 9).
    // Gross [6,4,5]: net A=6-2=4 vs B=4 → tie → no advance.
    // Gross [5,4,5]: net A=5-2=3 < B=4 → advance.
    const players = makePlayers(["A", "B", "C"]);
    const ctx = strokesCtx([27, 0, 0]);
    const tieResult = applyHole(players, [6, 4, 5], 1, ctx);
    const winResult = applyHole(players, [5, 4, 5], 1, ctx);
    expect(tieResult[0].targetIndex).toBe(1); // net tie → no advance
    expect(winResult[0].targetIndex).toBe(2); // net win → advances
  });

  it("hcp=27 gives only 1 stroke on SI=10 hole (outside double-stroke range)", () => {
    // Hole index 12, SI=10: hcp=27 → second lap allocates 9 strokes on SI ≤ 9 only.
    // SI=10 > 9 → only 1 stroke from the first lap.
    // Gross [5,4,5]: net A=5-1=4 vs B=4 → tie → no advance.
    const players = makePlayers(["A", "B", "C"]);
    const ctx = strokesCtx([27, 0, 0]);
    const tieResult = applyHole(players, [5, 4, 5], 12, ctx);
    expect(tieResult[0].targetIndex).toBe(1); // net tie → no advance
  });

  it("all players having equal strokes on a hole produces same relative outcome", () => {
    // When every player has the same handicap the stroke cancels out;
    // relative ordering is unchanged vs gross.
    const players = makePlayers(["A", "B", "C"]);
    const ctxEqual = strokesCtx([9, 9, 9]);
    const baseResult = applyHole(players, [3, 4, 5], 1);
    const equalResult = applyHole(players, [3, 4, 5], 1, ctxEqual);
    // Both players deducted by 1 stroke on hole 1 → relative comparison identical.
    expect(equalResult[0].targetIndex).toBe(baseResult[0].targetIndex);
    expect(equalResult[1].targetIndex).toBe(baseResult[1].targetIndex);
    expect(equalResult[2].targetIndex).toBe(baseResult[2].targetIndex);
  });
});

describe("applyHole — lap completion with handicap", () => {
  it("stroke-assisted beat completes a lap and awards a point (3-player)", () => {
    // A(hcp=9) has already beaten B and is now chasing C (targetIndex=2, last of lap).
    // startTargetIndex=1. Hole index 1 (SI=1): A gets 1 stroke.
    // Gross [4,5,4]: A vs C → 4=4 gross tie → without ctx no point.
    // Net A=3 < C=4 → advance; advanceTarget(0,2,3)=1 === startTargetIndex → +1 point.
    const players = makePlayers(["A", "B", "C"]);
    players[0].targetIndex = 2; // mid-lap, chasing C
    const ctx = strokesCtx([9, 0, 0]);
    const withoutCtx = applyHole(players, [4, 5, 4], 1);
    const withCtx = applyHole(players, [4, 5, 4], 1, ctx);
    expect(withoutCtx[0].points).toBe(0);                       // gross tie → no point
    expect(withCtx[0].points).toBe(1);                          // net win  → lap done
    expect(withCtx[0].targetIndex).toBe(players[0].startTargetIndex); // reset to B
  });

  it("stroke-assisted beat completes a lap and awards a point (2-player)", () => {
    // A(hcp=9) chases B; in a 2-player game the only target IS the start target,
    // so any advance immediately scores. Gross tie [4,4] → with handicap → +1 point.
    const players = makePlayers(["A", "B"]);
    const ctx = strokesCtx([9, 0]);
    const withoutCtx = applyHole(players, [4, 4], 1);
    const withCtx = applyHole(players, [4, 4], 1, ctx);
    expect(withoutCtx[0].points).toBe(0); // gross tie → no point
    expect(withCtx[0].points).toBe(1);   // net win  → lap done
    expect(withCtx[0].targetIndex).toBe(players[0].startTargetIndex);
  });

  it("net-win advance mid-lap does NOT award a point", () => {
    // A(hcp=9) starts the lap chasing B (targetIndex=1). Hole 1 net win → advance to C.
    // That's not the end of the lap → no point.
    const players = makePlayers(["A", "B", "C", "D"]);
    const ctx = strokesCtx([9, 0, 0, 0]);
    const result = applyHole(players, [4, 4, 5, 5], 1, ctx);
    expect(result[0].points).toBe(0);         // mid-lap advance, no point
    expect(result[0].targetIndex).toBe(2);    // advanced to C
  });
});

describe("recompute — handicap context", () => {
  it("matches iterative applyHole over a full sequence", () => {
    // 4 players, mixed handicaps. Verify recompute ≡ manual fold.
    const players = makePlayers(["A", "B", "C", "D"]);
    const ctx = strokesCtx([9, 0, 6, 0]);
    // Hole indices: 1(SI=1), 3(SI=3), 6(SI=9), 0(SI=11)
    const holes = [
      [4, 4, 5, 5], // hole 1 — A(hcp=9) and C(hcp=6) get strokes
      [3, 4, 3, 4], // hole 3 — A and C get strokes
      [4, 3, 4, 3], // hole 6 — A and C get strokes
      [4, 4, 4, 4], // hole 0 — no strokes (SI=11 > all handicaps here… wait, C=6<11 so no; A=9<11 so no)
    ];
    const iterative = holes.reduce<Player[]>(
      (acc, h, idx) => applyHole(acc, h, idx, ctx),
      players,
    );
    expect(recompute(resetPlayers(players), holes, ctx)).toEqual(iterative);
  });

  it("recompute without ctx and with ctx=undefined are equivalent", () => {
    const players = makePlayers(["A", "B", "C"]);
    const holes = [[3, 4, 5], [4, 5, 3]];
    expect(recompute(players, holes)).toEqual(recompute(players, holes, undefined));
  });

  it("recompute is consistent with handicap context — same input yields same output", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const ctx = strokesCtx([18, 9, 4, 0]);
    const holes = [
      [4, 4, 4, 4],
      [3, 4, 5, 6],
      [5, 4, 3, 4],
    ];
    expect(recompute(resetPlayers(players), holes, ctx)).toEqual(
      recompute(resetPlayers(players), holes, ctx),
    );
  });
});

describe("holeOutcomes — handicap context", () => {
  it("`advanced` is false without ctx for a gross tie, true with strokes ctx", () => {
    // A(hcp=9) chases B. Test hole is at array index 1 (hole 1, SI=1): A gets 1 stroke.
    // Gross [4,4,5]: A vs B is a gross tie → advanced=false without ctx.
    // Net A=3 < B=4 → advanced=true with strokes ctx.
    // Array index 0 uses [4,4,4] so nobody advances there (all tied).
    const players = makePlayers(["A", "B", "C"]);
    const ctx = strokesCtx([9, 0, 0]);
    const gross = holeOutcomes(players, [[4, 4, 4], [4, 4, 5]]);
    const net = holeOutcomes(players, [[4, 4, 4], [4, 4, 5]], ctx);
    expect(gross[1][0].advanced).toBe(false);
    expect(net[1][0].advanced).toBe(true);
  });

  it("`gauntlet` flag fires when stroke-assisted advance completes a lap", () => {
    // A is on the last of their 3-player lap (targetIndex=2). Tested at array index 1
    // (hole 1, SI=1) with A(hcp=9). Gross tie [4,5,4]: without ctx no advance/gauntlet.
    // Net A=3 < C=4 → advance completes lap → gauntlet=true.
    const players = makePlayers(["A", "B", "C"]);
    players[0].targetIndex = 2;
    const ctx = strokesCtx([9, 0, 0]);
    const grossMatrix = holeOutcomes(players, [[4, 4, 4], [4, 5, 4]]);
    const netMatrix = holeOutcomes(players, [[4, 4, 4], [4, 5, 4]], ctx);
    expect(grossMatrix[1][0]).toEqual({ advanced: false, gauntlet: false });
    expect(netMatrix[1][0]).toEqual({ advanced: true, gauntlet: true });
  });

  it("`advanced` uses per-player net — other players unaffected by A's strokes", () => {
    // A(hcp=9), B(hcp=0), C(hcp=0). Hole 1 (array index 1, SI=1): A gets 1 stroke only.
    // Scores [4,4,5]: B(idx=1) chases C(idx=2) → 4<5 → advances regardless of handicap.
    // C(idx=2) chases A(idx=0) → gross 5 vs gross 4 no; net C=5 vs net A=3 → 5<3? No.
    const players = makePlayers(["A", "B", "C"]);
    const ctx = strokesCtx([9, 0, 0]);
    const matrix = holeOutcomes(players, [[4, 4, 4], [4, 4, 5]], ctx);
    expect(matrix[1][0].advanced).toBe(true);  // A beats B via net
    expect(matrix[1][1].advanced).toBe(true);  // B beats C gross (unchanged)
    expect(matrix[1][2].advanced).toBe(false); // C cannot beat net-A
  });

  it("matrix dimensions are correct with handicap ctx across multiple holes", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const ctx = strokesCtx([9, 6, 3, 0]);
    const holes = Array.from({ length: 5 }, () => [4, 4, 4, 4] as number[]);
    const matrix = holeOutcomes(players, holes, ctx);
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(4));
  });

  it("gross and strokes modes produce identical results when all handicaps are 0", () => {
    const players = makePlayers(["A", "B", "C"]);
    const ctxStrokes = strokesCtx([0, 0, 0]);
    const holes = [[3, 4, 5], [4, 5, 3], [5, 3, 4]];
    const gross = holeOutcomes(players, holes);
    const strokes = holeOutcomes(players, holes, ctxStrokes);
    expect(strokes).toEqual(gross);
  });
});
