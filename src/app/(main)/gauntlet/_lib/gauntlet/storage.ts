import { z } from "zod";
import { GameStorage } from "../base/storage";
import {
  GAUNTLET_MAX_PLAYERS,
  GAUNTLET_MIN_PLAYERS,
  GAUNTLET_STORAGE_KEY,
  GAUNTLET_TOTAL_HOLES,
} from "./types";
import type { GauntletState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
  targetIndex: z.number().int().nonnegative(),
  startTargetIndex: z.number().int().nonnegative(),
});

export const GauntletStateSchema = z
  .object({
    mode: z.literal("gauntlet"),
    players: z
      .array(PlayerSchema)
      .min(GAUNTLET_MIN_PLAYERS)
      .max(GAUNTLET_MAX_PLAYERS),
    holes: z
      .array(z.array(z.number().int().positive()))
      .max(GAUNTLET_TOTAL_HOLES),
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

export const gauntletStorage = new GameStorage<GauntletState>(
  GAUNTLET_STORAGE_KEY,
  GauntletStateSchema,
);
