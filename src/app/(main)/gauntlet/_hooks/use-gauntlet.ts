"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyHole,
  makeInitialPlayers,
  recompute,
  resetPlayers,
} from "../_lib/engine";
import { loadState, saveLastNames, saveState } from "../_lib/storage";
import type { GauntletState, HoleScores } from "../_lib/types";
import { TOTAL_HOLES } from "../_lib/types";

export type UseGauntlet = {
  hydrated: boolean;
  state: GauntletState | null;
  startGame: (names: string[]) => void;
  submitHole: (scores: HoleScores) => void;
  /** Removes the last hole and returns its scores (for prefill), or null. */
  undoLastHole: () => HoleScores | null;
  editHole: (holeIndex: number, scores: HoleScores) => void;
  endRound: () => void;
  renamePlayer: (playerId: string, name: string) => void;
  resetGame: () => void;
  isGameOver: boolean;
  holeNumber: number;
};

export function useGauntlet(): UseGauntlet {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<GauntletState | null>(null);

  useEffect(() => {
    const loaded = loadState();
    if (loaded) setState(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  const startGame = useCallback((names: string[]) => {
    const trimmed = names.map((n, i) => n.trim() || `Player ${String(i + 1)}`);
    saveLastNames(trimmed);
    setState({ players: makeInitialPlayers(trimmed), holes: [] });
  }, []);

  const submitHole = useCallback((scores: HoleScores) => {
    setState((prev) => {
      if (!prev) return prev;
      if (prev.finishedAt !== undefined) return prev;
      if (prev.holes.length >= TOTAL_HOLES) return prev;
      return {
        players: applyHole(prev.players, scores),
        holes: [...prev.holes, scores],
      };
    });
  }, []);

  const undoLastHole = useCallback((): HoleScores | null => {
    let popped: HoleScores | null = null;
    setState((prev) => {
      if (!prev || prev.holes.length === 0) return prev;
      popped = prev.holes.at(-1) ?? null;
      const remaining = prev.holes.slice(0, -1);
      const initial = resetPlayers(prev.players);
      return { players: recompute(initial, remaining), holes: remaining };
    });
    return popped;
  }, []);

  const editHole = useCallback((holeIndex: number, scores: HoleScores) => {
    setState((prev) => {
      if (!prev) return prev;
      if (holeIndex < 0 || holeIndex >= prev.holes.length) return prev;
      const newHoles = prev.holes.map((h, i) => (i === holeIndex ? scores : h));
      const initial = resetPlayers(prev.players);
      return { players: recompute(initial, newHoles), holes: newHoles };
    });
  }, []);

  const endRound = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.holes.length === 0 || prev.finishedAt !== undefined)
        return prev;
      return { ...prev, finishedAt: prev.holes.length };
    });
  }, []);

  const renamePlayer = useCallback((playerId: string, name: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const trimmed = name.trim();
      if (!trimmed) return prev;
      return {
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, name: trimmed } : p,
        ),
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState(null);
  }, []);

  const holeNumber = (state?.holes.length ?? 0) + 1;
  const isGameOver =
    state?.finishedAt !== undefined ||
    (state?.holes.length ?? 0) >= TOTAL_HOLES;

  return {
    hydrated,
    state,
    startGame,
    submitHole,
    undoLastHole,
    editHole,
    endRound,
    renamePlayer,
    resetGame,
    isGameOver,
    holeNumber,
  };
}
