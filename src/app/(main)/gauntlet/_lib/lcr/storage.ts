import { z } from "zod";
import { GameStorage } from "../base/storage";
import { LCR_PLAYER_COUNT, LCR_STORAGE_KEY, LCR_TOTAL_HOLES } from "./types";
import type { LcrState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
});

const HoleSchema = z.object({
  scores: z.array(z.number().int().positive()).length(LCR_PLAYER_COUNT),
  centerIndex: z
    .number()
    .int()
    .min(0)
    .max(LCR_PLAYER_COUNT - 1),
});

const StateSchema = z
  .object({
    mode: z.literal("lcr"),
    players: z.array(PlayerSchema).length(LCR_PLAYER_COUNT),
    holes: z.array(HoleSchema).max(LCR_TOTAL_HOLES),
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

export const LcrStateSchema = StateSchema;

export const lcrStorage = new GameStorage<LcrState>(
  LCR_STORAGE_KEY,
  LcrStateSchema,
);
