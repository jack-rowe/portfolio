import { z } from "zod";
import { GameStorage } from "../base/storage";
import { HandicapConfigSchema } from "../handicap";
import {
  STROKEPLAY_MAX_HANDICAP,
  STROKEPLAY_MAX_PLAYERS,
  STROKEPLAY_MIN_PLAYERS,
  STROKEPLAY_STORAGE_KEY,
  STROKEPLAY_TOTAL_HOLES,
} from "./types";
import type { StrokeplayState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
  handicap: z.number().int().min(0).max(STROKEPLAY_MAX_HANDICAP),
});

const HoleSchema = z.object({
  scores: z
    .array(z.number().int().positive())
    .min(STROKEPLAY_MIN_PLAYERS)
    .max(STROKEPLAY_MAX_PLAYERS),
});

const StateSchema = z
  .object({
    mode: z.literal("strokeplay"),
    players: z
      .array(PlayerSchema)
      .min(STROKEPLAY_MIN_PLAYERS)
      .max(STROKEPLAY_MAX_PLAYERS),
    holes: z.array(HoleSchema).max(STROKEPLAY_TOTAL_HOLES),
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

export const StrokeplayStateSchema = StateSchema;

export const strokeplayStorage = new GameStorage<StrokeplayState>(
  STROKEPLAY_STORAGE_KEY,
  StrokeplayStateSchema,
);
