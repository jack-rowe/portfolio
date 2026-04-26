import { z } from "zod";
import { STORAGE_KEY } from "./types";
import type { GauntletState } from "./types";

const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.number().int().nonnegative(),
  targetIndex: z.number().int().nonnegative(),
  startTargetIndex: z.number().int().nonnegative(),
});

const StateSchema = z.object({
  players: z.array(PlayerSchema).min(2),
  holes: z.array(z.array(z.number().int().positive())),
  finishedAt: z.number().int().nonnegative().optional(),
});

export function loadState(): GauntletState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const result = StateSchema.safeParse(parsed);
    if (!result.success) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

export function saveState(state: GauntletState | null): void {
  if (typeof window === "undefined") return;
  if (state === null) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full / unavailable — silently ignore; game still works in-memory.
  }
}
