import type { GameMode } from "../types";
import type { BasePlayer, BaseState } from "./types";

/**
 * Abstract engine that every game mode extends. Concrete subclasses
 * implement the mode-specific scoring, validation and state-bootstrap logic;
 * the base class wires up shared lifecycle operations (end round, edit hole,
 * undo, rename, game-over checks) so individual modes only describe what
 * makes them different.
 *
 * Type parameters:
 *   TState         - mode's full persisted state shape
 *   THole          - mode's per-hole data type
 *   TPlayer        - mode's player shape (extends BasePlayer)
 *   TStartOptions  - extra options accepted by `createInitialState`
 *                    (use `void` if none).
 */
export abstract class GameEngine<
  TState extends BaseState<TPlayer, THole>,
  THole,
  TPlayer extends BasePlayer = BasePlayer,
  TStartOptions = void,
> {
  abstract readonly mode: GameMode;
  abstract readonly storageKey: string;
  abstract readonly totalHoles: number;
  abstract readonly minPlayers: number;
  abstract readonly maxPlayers: number;

  /** Build a fresh state for a new game. Must validate name count itself. */
  abstract createInitialState(
    names: string[],
    options: TStartOptions,
  ): TState | null;

  /** Validate one hole's data in the context of `state`, at `holeIndex`. */
  abstract validateHole(state: TState, hole: THole, holeIndex: number): boolean;

  /**
   * Append `hole` to state and apply mode-specific scoring. Implementations
   * should derive any positional context (wolf rotation, segment, etc.)
   * from `state.holes.length` before appending.
   */
  abstract applyHole(state: TState, hole: THole): TState;

  /**
   * Recompute player points from scratch using `state.holes`. Used after
   * edits and undo. Implementations typically reset player points then
   * fold `applyHole` over each hole.
   */
  abstract recompute(state: TState): TState;

  /** Validate persisted JSON via the mode's zod schema. */
  abstract parseState(raw: unknown): TState | null;

  isGameOver(state: TState | null): boolean {
    if (!state) return false;
    if (state.finishedAt !== undefined) return true;
    return state.holes.length >= this.totalHoles;
  }

  /** 1-indexed hole number for the next live entry. */
  holeNumber(state: TState | null): number {
    return (state?.holes.length ?? 0) + 1;
  }

  endRound(state: TState): TState {
    if (state.holes.length === 0) return state;
    if (state.finishedAt !== undefined) return state;
    return { ...state, finishedAt: state.holes.length };
  }

  editHole(state: TState, holeIndex: number, hole: THole): TState {
    if (holeIndex < 0 || holeIndex >= state.holes.length) return state;
    if (!this.validateHole(state, hole, holeIndex)) return state;
    const newHoles = state.holes.map((h, i) => (i === holeIndex ? hole : h));
    return this.recompute({ ...state, holes: newHoles });
  }

  undoLastHole(state: TState): { state: TState; popped: THole | null } {
    if (state.holes.length === 0) return { state, popped: null };
    const popped = state.holes.at(-1) ?? null;
    const remaining = state.holes.slice(0, -1);
    return {
      state: this.recompute({ ...state, holes: remaining }),
      popped,
    };
  }

  renamePlayer(state: TState, playerId: string, name: string): TState {
    const trimmed = name.trim();
    if (!trimmed) return state;
    return {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, name: trimmed } : p,
      ),
    };
  }

  /** Trim names and fall back to "Player N" placeholders for empty entries. */
  protected trimNames(names: string[]): string[] {
    return names.map((n, i) => n.trim() || `Player ${String(i + 1)}`);
  }

  /** Stable id generator, prefixed per-mode for easier debugging. */
  protected makeId(prefix: string, seed: number): string {
    const g: { crypto?: { randomUUID?: () => string } } =
      typeof globalThis === "undefined" ? {} : globalThis;
    if (g.crypto?.randomUUID) return g.crypto.randomUUID();
    return `${prefix}-${String(seed)}-${String(Date.now())}-${String(
      Math.random(),
    ).slice(2, 8)}`;
  }
}
