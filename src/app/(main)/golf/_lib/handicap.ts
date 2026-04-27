import { z } from "zod";
import type { CourseInfo } from "./courseData";

/** Maximum supported handicap index. */
export const MAX_HANDICAP = 54;

/**
 * "none"    - no handicapping. All scoring uses gross.
 * "gross"   - gross scoring during play; subtract player handicap from
 *             the player's gross total at the end. No per-hole adjustment.
 *             Works without a course.
 * "strokes" - allocate strokes per hole using the course's stroke index;
 *             score comparisons within a hole use net (gross - strokes).
 *             Requires a selected course.
 */
export type HandicapMode = "none" | "gross" | "strokes";

export type HandicapConfig = {
  mode: HandicapMode;
  /** Optional course id; required when mode === "strokes". */
  courseId?: string;
  /** Per-player whole-round handicap, length matches state.players. */
  handicaps: number[];
};

export const HandicapModeSchema = z.union([
  z.literal("none"),
  z.literal("gross"),
  z.literal("strokes"),
]);

export const HandicapConfigSchema = z.object({
  mode: HandicapModeSchema,
  courseId: z.string().optional(),
  handicaps: z.array(z.number().int().min(0).max(MAX_HANDICAP)),
});

/** Common start-options fragment threaded into every game mode. */
export type HandicapStartOptions = {
  handicap?: HandicapConfig;
};

/** Build a HandicapConfig from raw inputs, normalising/validating. */
export function buildHandicapConfig(
  mode: HandicapMode,
  courseId: string | null | undefined,
  handicaps: number[],
): HandicapConfig {
  const cleaned = handicaps.map((h) => {
    if (!Number.isFinite(h)) return 0;
    const i = Math.trunc(h);
    if (i < 0) return 0;
    if (i > MAX_HANDICAP) return MAX_HANDICAP;
    return i;
  });
  if (mode === "strokes" && !courseId) {
    return { mode: "gross", handicaps: cleaned };
  }
  if (mode === "none") {
    return { mode: "none", handicaps: cleaned };
  }
  return {
    mode,
    courseId: courseId ?? undefined,
    handicaps: cleaned,
  };
}

/**
 * Strokes a player receives on a single hole given their full handicap and
 * the hole's stroke index (1 = hardest, 18 = easiest).
 *
 *   hcp 0..18: 1 stroke on each hole whose strokeIndex <= hcp.
 *   hcp 19..36: 1 stroke everywhere; 2 strokes on the (hcp-18) hardest holes.
 *   hcp 37..54: 2 strokes everywhere; 3 strokes on the (hcp-36) hardest holes.
 */
export function strokesOnHole(handicap: number, strokeIndex: number): number {
  if (handicap <= 0) return 0;
  const HOLES_PER_ROUND = 18;
  let strokes = 0;
  let remaining = handicap;
  while (remaining > 0) {
    const allocate = Math.min(remaining, HOLES_PER_ROUND);
    if (strokeIndex <= allocate) strokes++;
    remaining -= HOLES_PER_ROUND;
  }
  return strokes;
}

/**
 * Net score for a player on a single hole.
 *   - "strokes" mode (with course): gross - strokesOnHole(handicap, SI)
 *   - other modes: returns gross unchanged
 */
export function netHoleScore(
  gross: number,
  playerIdx: number,
  holeIndex: number,
  config: HandicapConfig | undefined,
  course: CourseInfo | null,
): number {
  if (!config) return gross;
  if (config.mode !== "strokes") return gross;
  if (!course) return gross;
  const hcp = config.handicaps[playerIdx] ?? 0;
  const hole = course.holes[holeIndex];
  if (!hole) return gross;
  return gross - strokesOnHole(hcp, hole.strokeIndex);
}

/** Whole-round handicap deduction applied to a gross total. */
export function handicapDeduction(
  playerIdx: number,
  config: HandicapConfig | undefined,
): number {
  if (!config) return 0;
  if (config.mode === "none") return 0;
  return config.handicaps[playerIdx] ?? 0;
}

/**
 * Map every gross score in `scores` to its per-hole net for a single hole.
 * Used by hole-comparison games (matchplay, wolf, etc.) to compute team
 * bests / pairwise comparisons on a level playing field.
 */
export function netScoresForHole(
  scores: number[],
  holeIndex: number,
  config: HandicapConfig | undefined,
  course: CourseInfo | null,
): number[] {
  return scores.map((s, i) => netHoleScore(s, i, holeIndex, config, course));
}

/**
 * Strokes a single player receives on a single hole. Returns 0 unless
 * strokes mode is active with a selected course.
 */
export function playerStrokesOnHole(
  playerIdx: number,
  holeIndex: number,
  config: HandicapConfig | undefined,
  course: CourseInfo | null,
): number {
  if (!usesStrokes(config, course)) return 0;
  const hole = course?.holes[holeIndex];
  if (!hole) return 0;
  const hcp = config?.handicaps[playerIdx] ?? 0;
  return strokesOnHole(hcp, hole.strokeIndex);
}

/**
 * Strokes a team receives on a single hole. With a single ball (scramble),
 * any stroke a team member gets applies to the team — use the maximum
 * strokes across team members.
 */
export function teamStrokesOnHole(
  team: number[],
  holeIndex: number,
  config: HandicapConfig | undefined,
  course: CourseInfo | null,
): number {
  if (!usesStrokes(config, course)) return 0;
  let max = 0;
  for (const idx of team) {
    const s = playerStrokesOnHole(idx, holeIndex, config, course);
    if (s > max) max = s;
  }
  return max;
}

/** True when the engine should apply per-hole stroke adjustments. */
export function usesStrokes(
  config: HandicapConfig | undefined,
  course: CourseInfo | null,
): boolean {
  return !!config && config.mode === "strokes" && !!course;
}

/** True when the engine should apply a single end-of-round deduction. */
export function usesGrossDeduction(
  config: HandicapConfig | undefined,
): boolean {
  return !!config && config.mode === "gross";
}
