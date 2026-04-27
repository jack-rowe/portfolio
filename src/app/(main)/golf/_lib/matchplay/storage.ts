import { z } from "zod";
import { GameStorage } from "../base/storage";
import {
  MATCHPLAY_MAX_PLAYERS,
  MATCHPLAY_MIN_PLAYERS,
  MATCHPLAY_STORAGE_KEY,
  MATCHPLAY_TOTAL_HOLES,
} from "./types";
import type { MatchplayState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
});

const HoleSchema = z.object({
  scores: z
    .array(z.number().int().positive())
    .min(MATCHPLAY_MIN_PLAYERS)
    .max(MATCHPLAY_MAX_PLAYERS),
});

const StateSchema = z
  .object({
    mode: z.literal("matchplay"),
    players: z
      .array(PlayerSchema)
      .min(MATCHPLAY_MIN_PLAYERS)
      .max(MATCHPLAY_MAX_PLAYERS),
    holes: z.array(HoleSchema).max(MATCHPLAY_TOTAL_HOLES),
    finishedAt: z.number().int().nonnegative().optional(),
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

export const MatchplayStateSchema = StateSchema;

export const matchplayStorage = new GameStorage<MatchplayState>(
  MATCHPLAY_STORAGE_KEY,
  MatchplayStateSchema,
);
