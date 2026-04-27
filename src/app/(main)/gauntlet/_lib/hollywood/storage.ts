import { z } from "zod";
import { GameStorage } from "../base/storage";
import {
  HOLLYWOOD_PLAYER_COUNT,
  HOLLYWOOD_STORAGE_KEY,
  HOLLYWOOD_TOTAL_HOLES,
} from "./types";
import type { HollywoodState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
});

const HoleSchema = z.object({
  scores: z.array(z.number().int().positive()).length(HOLLYWOOD_PLAYER_COUNT),
});

const StateSchema = z
  .object({
    mode: z.literal("hollywood"),
    players: z.array(PlayerSchema).length(HOLLYWOOD_PLAYER_COUNT),
    holes: z.array(HoleSchema).max(HOLLYWOOD_TOTAL_HOLES),
    finishedAt: z.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.finishedAt !== undefined && data.finishedAt > data.holes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finishedAt"],
        message: "finishedAt exceeds holes played",
      });
    }
  });

export const HollywoodStateSchema = StateSchema;

export const hollywoodStorage = new GameStorage<HollywoodState>(
  HOLLYWOOD_STORAGE_KEY,
  HollywoodStateSchema,
);

export function loadHollywoodState(): HollywoodState | null {
  return hollywoodStorage.load();
}

export function saveHollywoodState(state: HollywoodState | null): void {
  hollywoodStorage.save(state);
}
