import { describe, expect, test } from "vitest";

import { getCourse } from "./courseData";
import {
  buildHandicapConfig,
  handicapDeduction,
  netHoleScore,
  netScoresForHole,
  playerStrokesOnHole,
  strokesOnHole,
  teamStrokesOnHole,
  usesGrossDeduction,
  usesStrokes,
  type HandicapConfig,
} from "./handicap";

import * as gauntlet from "./gauntlet/engine";
import type { Player as GauntletPlayer } from "./gauntlet/types";
import * as hollywood from "./hollywood/engine";
import type { HollywoodHole } from "./hollywood/types";
import { HOLLYWOOD_PLAYER_COUNT } from "./hollywood/types";
import * as lcr from "./lcr/engine";
import type { LcrHole } from "./lcr/types";
import { LCR_PLAYER_COUNT } from "./lcr/types";
import * as matchplay from "./matchplay/engine";
import type { MatchplayHole } from "./matchplay/types";
import * as strokeplay from "./strokeplay/engine";
import type { StrokeplayHole, StrokeplayPlayer } from "./strokeplay/types";
import * as vegas from "./vegas/engine";
import { DEFAULT_VEGAS_TEAMS, VEGAS_PLAYER_COUNT } from "./vegas/types";
import type { VegasHole } from "./vegas/types";
import * as wolf from "./wolf/engine";
import type { WolfHole } from "./wolf/types";

/**
 * greenhills stroke indices by hole index:
 *   0:11  1:1   2:13  3:3   4:5   5:17  6:9   7:15  8:7
 *   9:4  10:16 11:18 12:10 13:2  14:14 15:8  16:12 17:6
 *
 * For hcp 9, holes that get a stroke are those with SI <= 9:
 *   indices 1, 3, 4, 6, 8, 9, 13, 15, 17.
 *   Indices 0, 2, 5, 7, 10, 11, 12, 14, 16 get no stroke.
 */
const COURSE_ID = "greenhills";
const COURSE = getCourse(COURSE_ID);
if (!COURSE) throw new Error("test setup: greenhills course missing");

function strokesCfg(handicaps: number[]): HandicapConfig {
  return buildHandicapConfig("strokes", COURSE_ID, handicaps);
}

// =============================================================================
// handicap.ts — pure helpers
// =============================================================================

describe("buildHandicapConfig", () => {
  test("mode=none drops courseId and returns clean config", () => {
    const cfg = buildHandicapConfig("none", COURSE_ID, [1, 2]);
    expect(cfg).toEqual({ mode: "none", handicaps: [1, 2] });
  });
  test("mode=gross keeps courseId when given", () => {
    const cfg = buildHandicapConfig("gross", COURSE_ID, [3, 4]);
    expect(cfg).toEqual({
      mode: "gross",
      courseId: COURSE_ID,
      handicaps: [3, 4],
    });
  });
  test("mode=gross works without a course", () => {
    const cfg = buildHandicapConfig("gross", null, [3, 4]);
    expect(cfg).toEqual({
      mode: "gross",
      courseId: undefined,
      handicaps: [3, 4],
    });
  });
  test("mode=strokes with course is preserved", () => {
    const cfg = buildHandicapConfig("strokes", COURSE_ID, [9, 0]);
    expect(cfg.mode).toBe("strokes");
    expect(cfg.courseId).toBe(COURSE_ID);
  });
  test("mode=strokes with no course downgrades to gross", () => {
    const cfg = buildHandicapConfig("strokes", null, [9, 0]);
    expect(cfg.mode).toBe("gross");
    expect(cfg.handicaps).toEqual([9, 0]);
  });
  test("clamps handicaps: NaN, negatives, > MAX, and decimals", () => {
    const cfg = buildHandicapConfig("gross", null, [Number.NaN, -5, 99, 7.8]);
    expect(cfg.handicaps).toEqual([0, 0, 54, 7]);
  });
});

describe("strokesOnHole", () => {
  test("hcp 0 → 0 strokes everywhere", () => {
    expect(strokesOnHole(0, 1)).toBe(0);
    expect(strokesOnHole(0, 18)).toBe(0);
  });
  test("hcp 9: 1 stroke on SI<=9, 0 on SI>9", () => {
    expect(strokesOnHole(9, 1)).toBe(1);
    expect(strokesOnHole(9, 9)).toBe(1);
    expect(strokesOnHole(9, 10)).toBe(0);
    expect(strokesOnHole(9, 18)).toBe(0);
  });
  test("hcp 18: 1 stroke on every hole", () => {
    for (let si = 1; si <= 18; si++) expect(strokesOnHole(18, si)).toBe(1);
  });
  test("hcp 27: 2 strokes on SI<=9, 1 on SI>9", () => {
    expect(strokesOnHole(27, 1)).toBe(2);
    expect(strokesOnHole(27, 9)).toBe(2);
    expect(strokesOnHole(27, 10)).toBe(1);
    expect(strokesOnHole(27, 18)).toBe(1);
  });
  test("hcp 36: 2 strokes everywhere", () => {
    expect(strokesOnHole(36, 1)).toBe(2);
    expect(strokesOnHole(36, 18)).toBe(2);
  });
  test("hcp 54: 3 strokes everywhere", () => {
    expect(strokesOnHole(54, 1)).toBe(3);
    expect(strokesOnHole(54, 18)).toBe(3);
  });
});

describe("netHoleScore", () => {
  test("undefined config → returns gross", () => {
    expect(netHoleScore(5, 0, 1, undefined, COURSE)).toBe(5);
  });
  test("mode none → returns gross", () => {
    const cfg = buildHandicapConfig("none", COURSE_ID, [9]);
    expect(netHoleScore(5, 0, 1, cfg, COURSE)).toBe(5);
  });
  test("mode gross → returns gross (no per-hole adjustment)", () => {
    const cfg = buildHandicapConfig("gross", COURSE_ID, [9]);
    expect(netHoleScore(5, 0, 1, cfg, COURSE)).toBe(5);
  });
  test("mode strokes without course → returns gross", () => {
    const cfg = strokesCfg([9]);
    expect(netHoleScore(5, 0, 1, cfg, null)).toBe(5);
  });
  test("mode strokes with course: subtracts strokes for SI<=hcp", () => {
    // hole 1 → SI 1; hcp 9 → 1 stroke
    const cfg = strokesCfg([9, 0]);
    expect(netHoleScore(5, 0, 1, cfg, COURSE)).toBe(4);
    expect(netHoleScore(5, 1, 1, cfg, COURSE)).toBe(5);
  });
  test("mode strokes: hole outside hcp range gives 0 deduction", () => {
    // hole 0 → SI 11; hcp 9 → 0 strokes
    const cfg = strokesCfg([9]);
    expect(netHoleScore(5, 0, 0, cfg, COURSE)).toBe(5);
  });
  test("returns gross when holeIndex out of range", () => {
    const cfg = strokesCfg([9]);
    expect(netHoleScore(5, 0, 99, cfg, COURSE)).toBe(5);
  });
});

describe("netScoresForHole", () => {
  test("maps every player through netHoleScore", () => {
    // hole 1, SI 1: hcps [9,0,18,0] → strokes [1,0,1,0]
    const cfg = strokesCfg([9, 0, 18, 0]);
    expect(netScoresForHole([5, 5, 5, 5], 1, cfg, COURSE)).toEqual([
      4, 5, 4, 5,
    ]);
  });
  test("returns gross-equal array under non-strokes mode", () => {
    const cfg = buildHandicapConfig("gross", COURSE_ID, [9, 0]);
    expect(netScoresForHole([5, 6], 1, cfg, COURSE)).toEqual([5, 6]);
  });
});

describe("playerStrokesOnHole", () => {
  test("returns 0 when not strokes mode", () => {
    const cfg = buildHandicapConfig("gross", COURSE_ID, [18]);
    expect(playerStrokesOnHole(0, 1, cfg, COURSE)).toBe(0);
  });
  test("returns 0 when no course", () => {
    const cfg = strokesCfg([18]);
    expect(playerStrokesOnHole(0, 1, cfg, null)).toBe(0);
  });
  test("returns correct strokes when active", () => {
    const cfg = strokesCfg([9, 18]);
    expect(playerStrokesOnHole(0, 1, cfg, COURSE)).toBe(1); // SI 1, hcp 9
    expect(playerStrokesOnHole(0, 0, cfg, COURSE)).toBe(0); // SI 11, hcp 9
    expect(playerStrokesOnHole(1, 11, cfg, COURSE)).toBe(1); // SI 18, hcp 18
  });
});

describe("teamStrokesOnHole", () => {
  test("returns 0 when not active", () => {
    const cfg = buildHandicapConfig("gross", COURSE_ID, [18, 0]);
    expect(teamStrokesOnHole([0, 1], 1, cfg, COURSE)).toBe(0);
  });
  test("returns max strokes across team members", () => {
    // hole 1 SI 1: hcps [0, 9, 27] → strokes [0, 1, 2]
    const cfg = strokesCfg([0, 9, 27]);
    expect(teamStrokesOnHole([0, 1], 1, cfg, COURSE)).toBe(1);
    expect(teamStrokesOnHole([0, 1, 2], 1, cfg, COURSE)).toBe(2);
    expect(teamStrokesOnHole([0], 1, cfg, COURSE)).toBe(0);
  });
});

describe("handicapDeduction", () => {
  test("0 when undefined config", () => {
    expect(handicapDeduction(0, undefined)).toBe(0);
  });
  test("0 when mode=none", () => {
    const cfg = buildHandicapConfig("none", null, [9]);
    expect(handicapDeduction(0, cfg)).toBe(0);
  });
  test("returns player handicap when mode=gross", () => {
    const cfg = buildHandicapConfig("gross", null, [9, 18]);
    expect(handicapDeduction(0, cfg)).toBe(9);
    expect(handicapDeduction(1, cfg)).toBe(18);
  });
  test("returns 0 when index out of range", () => {
    const cfg = buildHandicapConfig("gross", null, [9]);
    expect(handicapDeduction(5, cfg)).toBe(0);
  });
});

describe("usesStrokes / usesGrossDeduction", () => {
  test("usesStrokes true only with strokes + course", () => {
    expect(usesStrokes(undefined, COURSE)).toBe(false);
    expect(usesStrokes(strokesCfg([9]), null)).toBe(false);
    expect(
      usesStrokes(buildHandicapConfig("gross", COURSE_ID, [9]), COURSE),
    ).toBe(false);
    expect(usesStrokes(buildHandicapConfig("none", null, [9]), COURSE)).toBe(
      false,
    );
    expect(usesStrokes(strokesCfg([9]), COURSE)).toBe(true);
  });
  test("usesGrossDeduction true only when mode=gross", () => {
    expect(usesGrossDeduction(undefined)).toBe(false);
    expect(usesGrossDeduction(buildHandicapConfig("none", null, [9]))).toBe(
      false,
    );
    expect(usesGrossDeduction(strokesCfg([9]))).toBe(false);
    expect(usesGrossDeduction(buildHandicapConfig("gross", null, [9]))).toBe(
      true,
    );
  });
});

// =============================================================================
// matchplay — handicap behavior
// =============================================================================

describe("matchplay/holeOutcome with handicap", () => {
  function mp(scores: number[]): MatchplayHole {
    return { scores };
  }
  const ctx = { handicap: strokesCfg([9, 0, 0, 0]), course: COURSE };

  test("ignores handicap on a hole the stroke does not apply to", () => {
    // hole 0 → SI 11; hcp 9 → no stroke. Gross winner stays the same.
    const out = matchplay.holeOutcome(mp([4, 3, 4, 4]), 4, 0, ctx);
    expect(out.result).toBe("win");
    expect(out.bestPlayers).toEqual([1]);
  });
  test("stroke flips a gross loss into a halve", () => {
    // hole 1 → SI 1; hcp 9 player 0 gets a stroke. Net [3,3,4,4].
    const out = matchplay.holeOutcome(mp([4, 3, 4, 4]), 4, 1, ctx);
    expect(out.result).toBe("halve");
    expect(out.bestPlayers).toEqual([0, 1]);
    expect(out.award).toEqual([0, 0, 0, 0]);
  });
  test("stroke flips a gross loss into a win for the stroke receiver", () => {
    // Net [3,4,4,4] → player 0 wins outright after the stroke.
    const out = matchplay.holeOutcome(mp([4, 4, 4, 4]), 4, 1, ctx);
    expect(out.result).toBe("win");
    expect(out.award).toEqual([1, 0, 0, 0]);
  });
  test("recompute with ctx differs from no-ctx baseline", () => {
    const players = matchplay.makeInitialPlayers(["A", "B", "C", "D"]);
    const holes = [mp([4, 3, 4, 4]), mp([4, 4, 4, 4])]; // holes 0 and 1
    const gross = matchplay.recompute(players, holes);
    const net = matchplay.recompute(players, holes, ctx);
    // Gross: hole0 B wins, hole1 halve → [0,1,0,0]
    expect(gross.map((p) => p.points)).toEqual([0, 1, 0, 0]);
    // Net: hole0 unchanged (B wins), hole1 A wins via stroke → [1,1,0,0]
    expect(net.map((p) => p.points)).toEqual([1, 1, 0, 0]);
  });
});

// =============================================================================
// wolf — handicap behavior
// =============================================================================

describe("wolf/holeOutcome with handicap", () => {
  function loneHole(scores: number[]): WolfHole {
    return { scores, decision: { kind: "lone", blind: false } };
  }
  function partnerHole(scores: number[], partnerIndex: number): WolfHole {
    return { scores, decision: { kind: "partner", partnerIndex } };
  }
  // Player 0 is wolf on hole index 4 (wolfFor(4,4)=0). SI 5 → hcp 9 gets a stroke.
  const ctx = { handicap: strokesCfg([9, 0, 0, 0]), course: COURSE };

  test("lone wolf: stroke flips opp win into a tie (no award)", () => {
    // Gross [4,3,3,3] → wolf loses; net [3,3,3,3] → tie.
    const out = wolf.holeOutcome(loneHole([4, 3, 3, 3]), 4, 4, ctx);
    expect(out.result).toBe("tie");
    expect(out.award).toEqual([0, 0, 0, 0]);
  });
  test("lone wolf: stroke turns loss into win", () => {
    // Gross [4,4,4,4] → tie (no award). Net [3,4,4,4] → wolf wins lone.
    const out = wolf.holeOutcome(loneHole([4, 4, 4, 4]), 4, 4, ctx);
    expect(out.result).toBe("wolf");
    expect(out.award[0]).toBe(wolf.LONE_WIN_POINTS);
  });
  test("partner team: best-ball uses net (stroke saves the team)", () => {
    // Wolf=0 partners with 1. Gross [4,5,3,3]: wolfBest=4, oppBest=3 → opp.
    // Net [3,5,3,3]: wolfBest=3, oppBest=3 → tie.
    const out = wolf.holeOutcome(partnerHole([4, 5, 3, 3], 1), 4, 4, ctx);
    expect(out.result).toBe("tie");
  });
  test("no stroke applied on holes outside hcp range", () => {
    // Hole 0 SI 11; hcp 9 → 0 strokes. Gross identical to net.
    const out = wolf.holeOutcome(loneHole([4, 3, 3, 3]), 0, 4, ctx);
    expect(out.result).toBe("opp");
  });
});

// =============================================================================
// vegas — handicap behavior
// =============================================================================

describe("vegas/holeOutcome with handicap", () => {
  function vh(scores: number[]): VegasHole {
    return { scores };
  }
  const ctx = { handicap: strokesCfg([9, 0, 0, 0]), course: COURSE };

  test("stroke flips team digits and changes the winner", () => {
    // Hole 1 SI 1: player 0 gets a stroke.
    // Gross [4,5,3,5] → A=45, B=35 → B wins (diff 10).
    // Net   [3,5,3,5] → A=35, B=35 → tie, no award.
    const out = vegas.holeOutcome(
      vh([4, 5, 3, 5]),
      DEFAULT_VEGAS_TEAMS,
      VEGAS_PLAYER_COUNT,
      1,
      ctx,
    );
    expect(out.winner).toBe("tie");
    expect(out.award).toEqual([0, 0, 0, 0]);
  });
  test("no handicap context → uses gross digits", () => {
    const out = vegas.holeOutcome(
      vh([4, 5, 3, 5]),
      DEFAULT_VEGAS_TEAMS,
      VEGAS_PLAYER_COUNT,
      1,
    );
    expect(out.winner).toBe("B");
  });
});

// =============================================================================
// lcr — handicap behavior
// =============================================================================

describe("lcr/holeOutcome with handicap", () => {
  function lh(scores: number[], centerIndex: number): LcrHole {
    return { scores, centerIndex };
  }
  const ctx = { handicap: strokesCfg([9, 0, 0]), course: COURSE };

  test("stroke turns outside win into a tie", () => {
    // Hole 1 SI 1; center=0 with hcp 9 gets a stroke.
    // Gross [4,3,5]: center 4, outside best 3 → outside.
    // Net   [3,3,5]: center 3, outside best 3 → tie.
    const out = lcr.holeOutcome(lh([4, 3, 5], 0), LCR_PLAYER_COUNT, 1, ctx);
    expect(out.winner).toBe("tie");
    expect(out.award).toEqual([0, 0, 0]);
  });
  test("stroke turns outside win into center win", () => {
    // Gross [4,4,5] → center 4, outside best 4 → tie.
    // Net   [3,4,5] → center 3 → center win.
    const out = lcr.holeOutcome(lh([4, 4, 5], 0), LCR_PLAYER_COUNT, 1, ctx);
    expect(out.winner).toBe("center");
  });
});

// =============================================================================
// hollywood — handicap behavior
// =============================================================================

describe("hollywood/holeOutcome with handicap", () => {
  function hh(scores: number[]): HollywoodHole {
    return { scores };
  }
  // Segment 0 (holes 0..5): teamA=[0,1], teamB=[2,3].
  // Hole 1 → SI 1 (everyone with hcp ≥ 1 gets a stroke).
  test("stroke on team B player flips A-win into tie", () => {
    const ctx = { handicap: strokesCfg([0, 0, 9, 0]), course: COURSE };
    // Gross [3,4,4,5] → bestA 3, bestB 4 → A wins.
    // Net   [3,4,3,5] → bestA 3, bestB 3 → tie.
    const out = hollywood.holeOutcome(
      hh([3, 4, 4, 5]),
      1,
      HOLLYWOOD_PLAYER_COUNT,
      ctx,
    );
    expect(out.winner).toBe("tie");
    expect(out.award).toEqual([0, 0, 0, 0]);
  });
  test("stroke on team B player flips A-win into B-win", () => {
    const ctx = { handicap: strokesCfg([0, 0, 9, 0]), course: COURSE };
    // Gross [3,4,3,5] → bestA 3, bestB 3 → tie.
    // Net   [3,4,2,5] → bestB 2 → B wins.
    const out = hollywood.holeOutcome(
      hh([3, 4, 3, 5]),
      1,
      HOLLYWOOD_PLAYER_COUNT,
      ctx,
    );
    expect(out.winner).toBe("B");
    expect(out.award).toEqual([0, 0, 1, 1]);
  });
  test("ctx is segment-agnostic; handicap follows player across segments", () => {
    const ctx = { handicap: strokesCfg([0, 9, 0, 0]), course: COURSE };
    // Hole 7 (segment 1: teamA=[0,2], teamB=[1,3]). SI=15 → hcp 9 gets no stroke.
    // Gross [4,3,5,5] → bestA 4, bestB 3 → B.
    const out7 = hollywood.holeOutcome(
      hh([4, 3, 5, 5]),
      7,
      HOLLYWOOD_PLAYER_COUNT,
      ctx,
    );
    expect(out7.winner).toBe("B");
    // Hole 13 (segment 2: teamA=[0,3], teamB=[1,2]). SI=2 → hcp 9 gets a stroke.
    // Gross [4,3,5,5] → bestA 4, bestB 3 → B.
    // Net   [4,2,5,5] → still B (better).
    const out13 = hollywood.holeOutcome(
      hh([4, 3, 5, 5]),
      13,
      HOLLYWOOD_PLAYER_COUNT,
      ctx,
    );
    expect(out13.winner).toBe("B");
    expect(out13.bestB).toBe(2);
  });
});

describe("hollywood/segmentScores with handicap", () => {
  function hh(scores: number[]): HollywoodHole {
    return { scores };
  }
  test("handicap-driven flips show up in segment totals", () => {
    const ctx = { handicap: strokesCfg([0, 0, 9, 0]), course: COURSE };
    // Six holes in segment 0. Construct one hole that flips with handicap.
    const holes: HollywoodHole[] = [
      hh([3, 4, 4, 5]), // hole 0 (SI 11): no stroke → bestA 3 < bestB 4 → A
      hh([3, 4, 4, 5]), // hole 1 (SI 1): stroke for P2 → tie
      hh([5, 5, 5, 5]), // hole 2: tie
      hh([5, 5, 5, 5]), // hole 3 (SI 3): stroke for P2 net → bestB 4 < bestA 5 → B
      hh([5, 5, 5, 5]), // hole 4 (SI 5): stroke for P2 net → B
      hh([5, 5, 5, 5]), // hole 5: tie (SI 17 → no stroke)
    ];
    const segs = hollywood.segmentScores(holes, ctx);
    expect(segs[0].teamAWins).toBe(1);
    expect(segs[0].teamBWins).toBe(2);
    expect(segs[0].ties).toBe(3);
    expect(segs[0].winner).toBe("B");
  });
});

// =============================================================================
// gauntlet — handicap behavior
// =============================================================================

describe("gauntlet/applyHole with handicap", () => {
  function makeGauntletPlayers(names: string[]): GauntletPlayer[] {
    const total = names.length;
    return names.map((name, i) => ({
      id: `id-${String(i)}`,
      name,
      points: 0,
      targetIndex: (i + 1) % total,
      startTargetIndex: (i + 1) % total,
    }));
  }
  const ctx = { handicap: strokesCfg([9, 0]), course: COURSE };

  test("stroke lets a tied gross score advance the chaser", () => {
    const players = makeGauntletPlayers(["A", "B"]);
    // Hole 1 SI 1: P0 has hcp 9 → 1 stroke. Gross [4,4]: tie, no advance.
    // Net [3,4]: 3 < 4 → P0 advances and (since target wraps to start) scores.
    const grossOnly = gauntlet.applyHole(players, [4, 4], 1);
    const withCtx = gauntlet.applyHole(players, [4, 4], 1, ctx);
    expect(grossOnly[0].points).toBe(0);
    expect(grossOnly[0].targetIndex).toBe(players[0].targetIndex);
    // 2-player game, advance from target=1 → start, scores a point.
    expect(withCtx[0].points).toBe(1);
  });
  test("no stroke on holes outside hcp range — no behavior change", () => {
    const players = makeGauntletPlayers(["A", "B"]);
    // Hole 0 SI 11: no stroke. Gross == Net.
    const a = gauntlet.applyHole(players, [4, 4], 0);
    const b = gauntlet.applyHole(players, [4, 4], 0, ctx);
    expect(a).toEqual(b);
  });
});

describe("gauntlet/holeOutcomes matrix with handicap", () => {
  function makeGauntletPlayers(names: string[]): GauntletPlayer[] {
    const total = names.length;
    return names.map((name, i) => ({
      id: `id-${String(i)}`,
      name,
      points: 0,
      targetIndex: (i + 1) % total,
      startTargetIndex: (i + 1) % total,
    }));
  }
  test("`advanced` flag uses net comparisons", () => {
    const players = makeGauntletPlayers(["A", "B", "C"]);
    const ctx = { handicap: strokesCfg([9, 0, 0]), course: COURSE };
    // hole 0 is a no-op (all-zero scores: 0 < 0 is false → nobody advances).
    // hole 1 SI 1; hcp 9 P0 stroke. Scores [4, 4, 5].
    // Gross: P0 vs target P1 → 4 < 4 false; P1 vs P2 → 4 < 5 true; P2 vs P0 → 5 < 4 false.
    // Net  : P0=3 < 4 true; rest unchanged.
    const holes = [
      [0, 0, 0],
      [4, 4, 5],
    ];
    const matrix = gauntlet.holeOutcomes(players, holes, ctx);
    expect(matrix[1][0].advanced).toBe(true);
    expect(matrix[1][1].advanced).toBe(true);
    expect(matrix[1][2].advanced).toBe(false);
    // Without ctx, P0 should NOT advance.
    const grossMatrix = gauntlet.holeOutcomes(players, holes);
    expect(grossMatrix[1][0].advanced).toBe(false);
  });
});

// =============================================================================
// strokeplay — handicap behavior (player-level handicap field)
// =============================================================================

describe("strokeplay/splitFor with handicap", () => {
  function sh(scores: number[]): StrokeplayHole {
    return { scores };
  }
  function makePlayer(
    name: string,
    handicap: number,
    idx: number,
  ): StrokeplayPlayer {
    return { id: `sp-${String(idx)}`, name, points: 0, handicap };
  }
  test("net = total − handicap", () => {
    const p = makePlayer("A", 9, 0);
    const holes: StrokeplayHole[] = [sh([4, 4]), sh([5, 4]), sh([3, 4])];
    const split = strokeplay.splitFor(p, 0, holes);
    expect(split.front).toBe(12);
    expect(split.back).toBe(0);
    expect(split.total).toBe(12);
    expect(split.net).toBe(3);
  });
  test("back-nine totals split correctly", () => {
    const p = makePlayer("A", 0, 0);
    const holes: StrokeplayHole[] = Array.from({ length: 18 }, (_, i) =>
      sh([i < 9 ? 4 : 5]),
    );
    const split = strokeplay.splitFor(p, 0, holes);
    expect(split.front).toBe(36);
    expect(split.back).toBe(45);
    expect(split.total).toBe(81);
    expect(split.net).toBe(81);
  });
  test("course attaches par data, no course omits it", () => {
    const p = makePlayer("A", 9, 0);
    const holes: StrokeplayHole[] = Array.from({ length: 18 }, () => sh([4]));
    const noCourse = strokeplay.splitFor(p, 0, holes);
    expect(noCourse.par).toBeUndefined();
    const withCourse = strokeplay.splitFor(p, 0, holes, COURSE);
    expect(withCourse.par).toBeDefined();
    const totalPar = COURSE.holes.reduce((acc, h) => acc + h.par, 0);
    expect(withCourse.par?.totalPar).toBe(totalPar);
    expect(withCourse.par?.toPar).toBe(72 - totalPar);
  });
  test("par data only counts holes that have been played", () => {
    const p = makePlayer("A", 0, 0);
    // Only 3 holes played.
    const holes: StrokeplayHole[] = [sh([4]), sh([5]), sh([3])];
    const split = strokeplay.splitFor(p, 0, holes, COURSE);
    const par3 =
      COURSE.holes[0].par + COURSE.holes[1].par + COURSE.holes[2].par;
    expect(split.par?.totalPar).toBe(par3);
    expect(split.par?.toPar).toBe(12 - par3);
  });
  test("net can be negative for low totals + high handicap", () => {
    const p = makePlayer("A", 18, 0);
    const holes: StrokeplayHole[] = [sh([3])];
    const split = strokeplay.splitFor(p, 0, holes);
    expect(split.net).toBe(-15);
  });
});

describe("strokeplay/finalStandings with handicap", () => {
  test("sorts by net (gross − handicap) ascending", () => {
    const players: StrokeplayPlayer[] = [
      { id: "1", name: "Hi-net A", points: 80, handicap: 0 }, // net 80
      { id: "2", name: "Bigger handicap B", points: 95, handicap: 18 }, // net 77 (winner)
      { id: "3", name: "Mid C", points: 85, handicap: 5 }, // net 80
    ];
    const fs = strokeplay.finalStandings(players);
    expect(fs.winner.name).toBe("Bigger handicap B");
    expect(fs.coWinners.map((p) => p.name)).toEqual(["Bigger handicap B"]);
    expect(fs.tied).toBe(false);
  });
  test("detects ties on net", () => {
    const players: StrokeplayPlayer[] = [
      { id: "1", name: "A", points: 80, handicap: 0 },
      { id: "2", name: "B", points: 90, handicap: 10 },
    ];
    const fs = strokeplay.finalStandings(players);
    expect(fs.tied).toBe(true);
    expect(fs.coWinners).toHaveLength(2);
  });
});
