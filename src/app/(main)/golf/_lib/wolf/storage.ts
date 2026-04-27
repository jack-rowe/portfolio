import { z } from "zod";
import { GameStorage } from "../base/storage";
import { WOLF_PLAYER_COUNT, WOLF_STORAGE_KEY, WOLF_TOTAL_HOLES } from "./types";
import type { WolfState } from "./types";

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
});

const PartnerDecisionSchema = z.object({
  kind: z.literal("partner"),
  partnerIndex: z
    .number()
    .int()
    .min(0)
    .max(WOLF_PLAYER_COUNT - 1),
});

const LoneDecisionSchema = z.object({
  kind: z.literal("lone"),
  blind: z.boolean(),
});

const DecisionSchema = z.discriminatedUnion("kind", [
  PartnerDecisionSchema,
  LoneDecisionSchema,
]);

const HoleSchema = z.object({
  scores: z.array(z.number().int().positive()).length(WOLF_PLAYER_COUNT),
  decision: DecisionSchema,
});

const StateSchema = z
  .object({
    mode: z.literal("wolf"),
    players: z.array(PlayerSchema).length(WOLF_PLAYER_COUNT),
    holes: z.array(HoleSchema).max(WOLF_TOTAL_HOLES),
    finishedAt: z.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    data.holes.forEach((hole, holeIdx) => {
      const wolfIdx = holeIdx % WOLF_PLAYER_COUNT;
      if (
        hole.decision.kind === "partner" &&
        hole.decision.partnerIndex === wolfIdx
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["holes", holeIdx, "decision", "partnerIndex"],
          message: `partner index equals wolf index (${String(wolfIdx)})`,
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

export const WolfStateSchema = StateSchema;

export const wolfStorage = new GameStorage<WolfState>(
  WOLF_STORAGE_KEY,
  WolfStateSchema,
);

export function loadWolfState(): WolfState | null {
  return wolfStorage.load();
}

export function saveWolfState(state: WolfState | null): void {
  wolfStorage.save(state);
}
