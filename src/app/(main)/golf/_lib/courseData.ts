/**
 * Hardcoded course data. Add courses here as needed.
 *
 * Each course has 18 holes. Each hole records:
 *   - par:         3, 4, or 5
 *   - strokeIndex: 1..18 — handicap allocation rank, lowest = hardest
 *
 * Stroke indices must be a permutation of 1..18.
 */

export type HoleInfo = {
  par: number;
  strokeIndex: number;
};

export type CourseInfo = {
  id: string;
  name: string;
  holes: HoleInfo[];
};

export const COURSES: readonly CourseInfo[] = [
  {
    id: "greenhills",
    name: "Greenhills",
    holes: [
      { par: 4, strokeIndex: 11 },
      { par: 5, strokeIndex: 1 },
      { par: 3, strokeIndex: 13 },
      { par: 5, strokeIndex: 3 },
      { par: 4, strokeIndex: 5 },
      { par: 3, strokeIndex: 17 },
      { par: 4, strokeIndex: 9 },
      { par: 3, strokeIndex: 15 },
      { par: 4, strokeIndex: 7 },
      { par: 5, strokeIndex: 4 },
      { par: 4, strokeIndex: 16 },
      { par: 3, strokeIndex: 18 },
      { par: 4, strokeIndex: 10 },
      { par: 5, strokeIndex: 2 },
      { par: 3, strokeIndex: 14 },
      { par: 4, strokeIndex: 8 },
      { par: 4, strokeIndex: 12 },
      { par: 5, strokeIndex: 6 },
    ],
  },
  {
    id: "forestcity",
    name: "Forest City National",
    holes: [
      { par: 5, strokeIndex: 13 },
      { par: 4, strokeIndex: 9 },
      { par: 4, strokeIndex: 11 },
      { par: 3, strokeIndex: 15 },
      { par: 5, strokeIndex: 7 },
      { par: 4, strokeIndex: 5 },
      { par: 3, strokeIndex: 17 },
      { par: 4, strokeIndex: 3 },
      { par: 4, strokeIndex: 1 },
      { par: 5, strokeIndex: 14 },
      { par: 4, strokeIndex: 6 },
      { par: 4, strokeIndex: 2 },
      { par: 3, strokeIndex: 16 },
      { par: 4, strokeIndex: 8 },
      { par: 5, strokeIndex: 12 },
      { par: 4, strokeIndex: 10 },
      { par: 3, strokeIndex: 18 },
      { par: 4, strokeIndex: 4 },
    ],
  },
];

export function getCourse(
  courseId: string | null | undefined,
): CourseInfo | null {
  if (!courseId) return null;
  return COURSES.find((c) => c.id === courseId) ?? null;
}

const FRONT_NINE_END = 9;
const BACK_NINE_END = 18;

export function coursePar(course: CourseInfo): number {
  return course.holes.reduce((sum, h) => sum + h.par, 0);
}

export function frontPar(course: CourseInfo): number {
  return course.holes
    .slice(0, FRONT_NINE_END)
    .reduce((sum, h) => sum + h.par, 0);
}

export function backPar(course: CourseInfo): number {
  return course.holes
    .slice(FRONT_NINE_END, BACK_NINE_END)
    .reduce((sum, h) => sum + h.par, 0);
}
