import { z } from "zod";
import { GameStorage } from "../base/storage";
import { HandicapConfigSchema } from "../handicap";
import {
  SCRAMBLE_MAX_PLAYERS,
  SCRAMBLE_MIN_PLAYERS,
  SCRAMBLE_STORAGE_KEY,
  SCRAMBLE_TOTAL_HOLES,
} from "./types";
import type { ScrambleState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
});

const HoleSchema = z.object({
  teamScores: z.array(z.number().int().positive()).min(1).max(2),
});

const StateSchema = z
  .object({
    mode: z.literal("scramble"),
    layout: z.union([z.literal("2v2"), z.literal("4v0")]),
    format: z.union([z.literal("matchplay"), z.literal("strokeplay")]),
    players: z
      .array(PlayerSchema)
      .min(SCRAMBLE_MIN_PLAYERS)
      .max(SCRAMBLE_MAX_PLAYERS),
    teams: z.array(z.array(z.number().int().nonnegative())).min(1).max(2),
    holes: z.array(HoleSchema).max(SCRAMBLE_TOTAL_HOLES),
    finishedAt: z.number().int().nonnegative().optional(),
    handicap: HandicapConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const teamCount = data.teams.length;
    const playerCount = data.players.length;
    if (data.layout === "2v2" && (teamCount !== 2 || playerCount !== 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["teams"],
        message: "2v2 requires 2 teams and 4 players",
      });
    }
    if (data.layout === "4v0" && (teamCount !== 1 || playerCount !== 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["teams"],
        message: "4v0 requires 1 team of 4",
      });
    }
    if (data.layout === "4v0" && data.format === "matchplay") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["format"],
        message: "4v0 cannot be matchplay",
      });
    }
    const seen = new Set<number>();
    for (const team of data.teams) {
      for (const idx of team) {
        if (idx < 0 || idx >= playerCount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["teams"],
            message: `team member index ${String(idx)} out of range`,
          });
        }
        if (seen.has(idx)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["teams"],
            message: "duplicate player across teams",
          });
        }
        seen.add(idx);
      }
    }
    data.holes.forEach((hole, idx) => {
      if (hole.teamScores.length !== teamCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["holes", idx, "teamScores"],
          message: `hole ${String(idx)} has ${String(hole.teamScores.length)} team scores, expected ${String(teamCount)}`,
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

export const ScrambleStateSchema = StateSchema;

export const scrambleStorage = new GameStorage<ScrambleState>(
  SCRAMBLE_STORAGE_KEY,
  ScrambleStateSchema,
);
