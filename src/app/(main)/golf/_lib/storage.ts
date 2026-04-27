import { z } from "zod";
import {
  ACTIVE_MODE_KEY,
  LAST_MODE_KEY,
  LAST_NAMES_KEY,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from "./types";
import type { GameMode } from "./types";

const LastNamesSchema = z.object({
  count: z.number().int().min(MIN_PLAYERS).max(MAX_PLAYERS),
  names: z.array(z.string()).min(MIN_PLAYERS).max(MAX_PLAYERS),
});

export type LastNames = z.infer<typeof LastNamesSchema>;

export function loadLastNames(): LastNames | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_NAMES_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const result = LastNamesSchema.safeParse(parsed);
    if (!result.success) {
      window.localStorage.removeItem(LAST_NAMES_KEY);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

export function saveLastNames(names: string[]): void {
  if (typeof window === "undefined") return;
  if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS) return;
  try {
    const payload: LastNames = { count: names.length, names };
    window.localStorage.setItem(LAST_NAMES_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

const ModeSchema = z.union([
  z.literal("gauntlet"),
  z.literal("wolf"),
  z.literal("vegas"),
  z.literal("hollywood"),
  z.literal("lcr"),
  z.literal("matchplay"),
  z.literal("strokeplay"),
  z.literal("scramble"),
]);

function readMode(key: string): GameMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const result = ModeSchema.safeParse(parsed);
    if (!result.success) {
      window.localStorage.removeItem(key);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

function writeMode(key: string, mode: GameMode | null): void {
  if (typeof window === "undefined") return;
  if (mode === null) {
    window.localStorage.removeItem(key);
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(mode));
  } catch {
    // ignore
  }
}

/** The mode of the currently active in-progress game, or null if none. */
export function loadActiveMode(): GameMode | null {
  return readMode(ACTIVE_MODE_KEY);
}

export function saveActiveMode(mode: GameMode | null): void {
  writeMode(ACTIVE_MODE_KEY, mode);
}

/** The mode the user picked last time, used to default the Setup screen. */
export function loadLastMode(): GameMode | null {
  return readMode(LAST_MODE_KEY);
}

export function saveLastMode(mode: GameMode): void {
  writeMode(LAST_MODE_KEY, mode);
}
