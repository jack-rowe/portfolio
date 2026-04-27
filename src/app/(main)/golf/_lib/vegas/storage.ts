import { z } from "zod";
import { GameStorage } from "../base/storage";
import { HandicapConfigSchema } from "../handicap";
import {
  VEGAS_PLAYER_COUNT,
  VEGAS_STORAGE_KEY,
  VEGAS_TOTAL_HOLES,
} from "./types";
import type { VegasState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int(),
});

const PairSchema = z
  .tuple([
    z
      .number()
      .int()
      .min(0)
      .max(VEGAS_PLAYER_COUNT - 1),
    z
      .number()
      .int()
      .min(0)
      .max(VEGAS_PLAYER_COUNT - 1),
  ])
  .refine((t) => t[0] !== t[1], "team pair must have distinct indices");

const TeamsSchema = z
  .object({
    teamA: PairSchema,
    teamB: PairSchema,
  })
  .refine(
    (t) => {
      const set = new Set([...t.teamA, ...t.teamB]);
      return set.size === VEGAS_PLAYER_COUNT;
    },
    { message: "teamA and teamB must partition all players" },
  );

const HoleSchema = z.object({
  scores: z.array(z.number().int().positive()).length(VEGAS_PLAYER_COUNT),
});

const StateSchema = z
  .object({
    mode: z.literal("vegas"),
    players: z.array(PlayerSchema).length(VEGAS_PLAYER_COUNT),
    teams: TeamsSchema,
    holes: z.array(HoleSchema).max(VEGAS_TOTAL_HOLES),
    finishedAt: z.number().int().nonnegative().optional(),
    handicap: HandicapConfigSchema.optional(),
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

export const VegasStateSchema = StateSchema;

export const vegasStorage = new GameStorage<VegasState>(
  VEGAS_STORAGE_KEY,
  VegasStateSchema,
);

export function loadVegasState(): VegasState | null {
  return vegasStorage.load();
}

export function saveVegasState(state: VegasState | null): void {
  vegasStorage.save(state);
}
