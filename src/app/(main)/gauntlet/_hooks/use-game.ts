"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameEngine } from "../_lib/base/engine";
import type { BasePlayer, BaseState } from "../_lib/base/types";

export type UseGame<
  TState extends BaseState<TPlayer, THole>,
  THole,
  TPlayer extends BasePlayer,
  TStartOptions,
> = {
  hydrated: boolean;
  state: TState | null;
  /** Direct setter, mostly for advanced flows like Wolf's pre-hole decision. */
  setState: (state: TState | null) => void;
  startGame: (names: string[], options: TStartOptions) => void;
  submitHole: (hole: THole) => void;
  /** Removes the last hole and returns its data (for prefill), or null. */
  undoLastHole: () => THole | null;
  editHole: (holeIndex: number, hole: THole) => void;
  endRound: () => void;
  renamePlayer: (playerId: string, name: string) => void;
  resetGame: () => void;
  isGameOver: boolean;
  holeNumber: number;
};

/**
 * Generic state-management hook used by every mode. Wires localStorage
 * persistence, hydration, and lifecycle methods to a GameEngine instance.
 */
export function useGame<
  TState extends BaseState<TPlayer, THole>,
  THole,
  TPlayer extends BasePlayer,
  TStartOptions,
>(
  engine: GameEngine<TState, THole, TPlayer, TStartOptions>,
): UseGame<TState, THole, TPlayer, TStartOptions> {
  const [hydrated, setHydrated] = useState(false);
  const [state, setStateInternal] = useState<TState | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(engine.storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        const valid = engine.parseState(parsed);
        if (valid) {
          setStateInternal(valid);
        } else {
          window.localStorage.removeItem(engine.storageKey);
        }
      }
    } catch {
      // ignore — start with no state.
    }
    setHydrated(true);
  }, [engine]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    if (state === null) {
      window.localStorage.removeItem(engine.storageKey);
      return;
    }
    try {
      window.localStorage.setItem(engine.storageKey, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, hydrated, engine]);

  const setState = useCallback((next: TState | null) => {
    setStateInternal(next);
  }, []);

  const startGame = useCallback(
    (names: string[], options: TStartOptions) => {
      if (names.length < engine.minPlayers) return;
      if (names.length > engine.maxPlayers) return;
      const next = engine.createInitialState(names, options);
      if (next) setStateInternal(next);
    },
    [engine],
  );

  const submitHole = useCallback(
    (hole: THole) => {
      setStateInternal((prev) => {
        if (!prev) return prev;
        if (engine.isGameOver(prev)) return prev;
        if (!engine.validateHole(prev, hole, prev.holes.length)) return prev;
        return engine.applyHole(prev, hole);
      });
    },
    [engine],
  );

  const undoLastHole = useCallback((): THole | null => {
    let popped: THole | null = null;
    setStateInternal((prev) => {
      if (!prev) return prev;
      const r = engine.undoLastHole(prev);
      popped = r.popped;
      return r.state;
    });
    return popped;
  }, [engine]);

  const editHole = useCallback(
    (holeIndex: number, hole: THole) => {
      setStateInternal((prev) =>
        prev ? engine.editHole(prev, holeIndex, hole) : prev,
      );
    },
    [engine],
  );

  const endRound = useCallback(() => {
    setStateInternal((prev) => (prev ? engine.endRound(prev) : prev));
  }, [engine]);

  const renamePlayer = useCallback(
    (playerId: string, name: string) => {
      setStateInternal((prev) =>
        prev ? engine.renamePlayer(prev, playerId, name) : prev,
      );
    },
    [engine],
  );

  const resetGame = useCallback(() => {
    setStateInternal(null);
  }, []);

  return {
    hydrated,
    state,
    setState,
    startGame,
    submitHole,
    undoLastHole,
    editHole,
    endRound,
    renamePlayer,
    resetGame,
    isGameOver: engine.isGameOver(state),
    holeNumber: engine.holeNumber(state),
  };
}
