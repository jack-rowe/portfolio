import { z } from "zod";
import { GameStorage } from "../base/storage";
import { HandicapConfigSchema } from "../handicap";
import {
  STABLEFORD_MAX_HANDICAP,
  STABLEFORD_MAX_PLAYERS,
  STABLEFORD_MIN_PLAYERS,
  STABLEFORD_STORAGE_KEY,
  STABLEFORD_TOTAL_HOLES,
} from "./types";
import type { StablefordState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
  handicap: z.number().int().min(0).max(STABLEFORD_MAX_HANDICAP),
});

const HoleSchema = z.object({
  scores: z
    .array(z.number().int().positive())
    .min(STABLEFORD_MIN_PLAYERS)
    .max(STABLEFORD_MAX_PLAYERS),
});

const StateSchema = z
  .object({
    mode: z.literal("stableford"),
    players: z
      .array(PlayerSchema)
      .min(STABLEFORD_MIN_PLAYERS)
      .max(STABLEFORD_MAX_PLAYERS),
    holes: z.array(HoleSchema).max(STABLEFORD_TOTAL_HOLES),
    finishedAt: z.number().int().nonnegative().optional(),
    handicap: HandicapConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const playerCount = data.players.length;
    data.holes.forEach((hole, idx) => {
      if (hole.scores.length !== playerCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["holes", idx, "scores"],
          message: `hole ${String(idx)} has ${String(hole.scores.length)} scores, expected ${String(playerCount)}`,
        });
      }
    });
    if (data.finishedAt !== undefined && data.finishedAt > data.holes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finishedAt"],
        message: "finishedAt exceeds holes played",
      });
    }
  });

export const StablefordStateSchema = StateSchema;

export const stablefordStorage = new GameStorage<StablefordState>(
  STABLEFORD_STORAGE_KEY,
  StablefordStateSchema,
);
