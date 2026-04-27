import { z } from "zod";
import {
  LAST_NAMES_KEY,
  MAX_PLAYERS,
  MIN_PLAYERS,
  STORAGE_KEY,
  TOTAL_HOLES,
} from "./types";
import type { GauntletState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
  targetIndex: z.number().int().nonnegative(),
  startTargetIndex: z.number().int().nonnegative(),
});

const StateSchema = z
  .object({
    players: z.array(PlayerSchema).min(MIN_PLAYERS).max(MAX_PLAYERS),
    holes: z.array(z.array(z.number().int().positive())).max(TOTAL_HOLES),
    finishedAt: z.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const playerCount = data.players.length;
    data.holes.forEach((scores, idx) => {
      if (scores.length !== playerCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["holes", idx],
          message: `hole ${String(idx)} has ${String(scores.length)} scores, expected ${String(playerCount)}`,
        });
      }
    });
    for (const p of data.players) {
      if (p.targetIndex >= playerCount || p.startTargetIndex >= playerCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["players"],
          message: "target index out of range",
        });
        break;
      }
    }
    if (data.finishedAt !== undefined && data.finishedAt > data.holes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finishedAt"],
        message: "finishedAt exceeds holes played",
      });
    }
  });

const LastNamesSchema = z.object({
  count: z.number().int().min(MIN_PLAYERS).max(MAX_PLAYERS),
  names: z.array(z.string()).min(MIN_PLAYERS).max(MAX_PLAYERS),
});

export type LastNames = z.infer<typeof LastNamesSchema>;

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
