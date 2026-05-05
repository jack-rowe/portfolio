import { useCallback, useState } from "react";
import { COURSE } from "../_lib/courses";

export type GameState = {
  holeIndex: number; // 0-based
  strokes: number; // for current hole
  scores: (number | null)[]; // strokes per hole; null = not yet played
  status: "playing" | "complete" | "finished";
};

const TOTAL_HOLES = COURSE.length;

export function useGame() {
  const [state, setState] = useState<GameState>(() => ({
    holeIndex: 0,
    strokes: 0,
    scores: new Array<number | null>(TOTAL_HOLES).fill(null),
    status: "playing",
  }));

  const addStroke = useCallback(() => {
    setState((s) =>
      s.status === "playing" ? { ...s, strokes: s.strokes + 1 } : s,
    );
  }, []);

  const completeHole = useCallback(() => {
    setState((s) => {
      if (s.status !== "playing") return s;
      const scores = [...s.scores];
      // strokes is the count when sink occurred; if 0 (impossible normally) treat as 1
      scores[s.holeIndex] = Math.max(1, s.strokes);
      return { ...s, scores, status: "complete" };
    });
  }, []);

  const nextHole = useCallback(() => {
    setState((s) => {
      if (s.status !== "complete") return s;
      const next = s.holeIndex + 1;
      if (next >= TOTAL_HOLES) {
        return { ...s, status: "finished" };
      }
      return { ...s, holeIndex: next, strokes: 0, status: "playing" };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      holeIndex: 0,
      strokes: 0,
      scores: new Array<number | null>(TOTAL_HOLES).fill(null),
      status: "playing",
    });
  }, []);

  const totalStrokes = state.scores.reduce<number>(
    (sum, s) => sum + (s ?? 0),
    0,
  );
  const totalPar = COURSE.slice(
    0,
    state.scores.filter((s) => s !== null).length,
  ).reduce((sum, h) => sum + h.par, 0);
  const relativeToPar = totalStrokes - totalPar;
  const currentHole = COURSE[state.holeIndex];

  return {
    state,
    currentHole,
    totalStrokes,
    relativeToPar,
    totalHoles: TOTAL_HOLES,
    addStroke,
    completeHole,
    nextHole,
    reset,
  };
}
