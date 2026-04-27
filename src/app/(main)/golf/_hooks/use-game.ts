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
  const [stateInternal, setStateInternal] = useState<TState | null>(null);

  useEffect(() => {
    if (globalThis.window === undefined) {
      setHydrated(true);
      return;
    }
    try {
      const raw = globalThis.window.localStorage.getItem(engine.storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        const valid = engine.parseState(parsed);
        if (valid) {
          setStateInternal(valid);
        } else {
          globalThis.window.localStorage.removeItem(engine.storageKey);
        }
      }
    } catch {
      // ignore — start with no state.
    }
    setHydrated(true);
  }, [engine]);

  useEffect(() => {
    if (!hydrated) return;
    if (globalThis.window === undefined) return;
    if (stateInternal === null) {
      globalThis.window.localStorage.removeItem(engine.storageKey);
      return;
    }
    try {
      globalThis.window.localStorage.setItem(
        engine.storageKey,
        JSON.stringify(stateInternal),
      );
    } catch {
      // ignore
    }
  }, [stateInternal, hydrated, engine]);

  const setState = useCallback((next: TState | null) => {
    setStateInternal(next);
  }, []);

  const startGame = useCallback(
    (names: string[], options: TStartOptions) => {
      if (names.length < engine.minPlayers) return;
      if (names.length > engine.maxPlayers) return;
      const next = engine.createInitialState(names, options);
      if (next) {
        // Write synchronously so shell components that mount in the same
        // commit can read the state from localStorage in their own hydration
        // effects (child effects run before parent effects in React).
        try {
          globalThis.window.localStorage.setItem(
            engine.storageKey,
            JSON.stringify(next),
          );
        } catch {
          // ignore
        }
        setStateInternal(next);
      }
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
    state: stateInternal,
    setState,
    startGame,
    submitHole,
    undoLastHole,
    editHole,
    endRound,
    renamePlayer,
    resetGame,
    isGameOver: engine.isGameOver(stateInternal),
    holeNumber: engine.holeNumber(stateInternal),
  };
}
