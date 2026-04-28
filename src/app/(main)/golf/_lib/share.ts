import { z } from "zod";
import { GauntletStateSchema } from "./gauntlet/storage";
import { WolfStateSchema } from "./wolf/storage";
import { VegasStateSchema } from "./vegas/storage";
import { HollywoodStateSchema } from "./hollywood/storage";
import { LcrStateSchema } from "./lcr/storage";
import { MatchplayStateSchema } from "./matchplay/storage";
import { StrokeplayStateSchema } from "./strokeplay/storage";
import { StablefordStateSchema } from "./stableford/storage";
import { ScrambleStateSchema } from "./scramble/storage";
import type { GauntletState } from "./gauntlet/types";
import type { WolfState } from "./wolf/types";
import type { VegasState } from "./vegas/types";
import type { HollywoodState } from "./hollywood/types";
import type { LcrState } from "./lcr/types";
import type { MatchplayState } from "./matchplay/types";
import type { StrokeplayState } from "./strokeplay/types";
import type { StablefordState } from "./stableford/types";
import type { ScrambleState } from "./scramble/types";
import type { GameMode } from "./types";

export const SHARE_VERSION = 1;

export type ShareableState =
  | GauntletState
  | WolfState
  | VegasState
  | HollywoodState
  | LcrState
  | MatchplayState
  | StrokeplayState
  | StablefordState
  | ScrambleState;

const SchemaByMode = {
  gauntlet: GauntletStateSchema,
  wolf: WolfStateSchema,
  vegas: VegasStateSchema,
  hollywood: HollywoodStateSchema,
  lcr: LcrStateSchema,
  matchplay: MatchplayStateSchema,
  strokeplay: StrokeplayStateSchema,
  stableford: StablefordStateSchema,
  scramble: ScrambleStateSchema,
} as const;

const EnvelopeSchema = z.object({
  v: z.literal(SHARE_VERSION),
  m: z.union([
    z.literal("gauntlet"),
    z.literal("wolf"),
    z.literal("vegas"),
    z.literal("hollywood"),
    z.literal("lcr"),
    z.literal("matchplay"),
    z.literal("strokeplay"),
    z.literal("scramble"),
    z.literal("stableford"),
  ]),
  s: z.unknown(),
});

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(bin)
      : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array | null {
  try {
    const padLen = (4 - (s.length % 4)) % 4;
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
    const bin =
      typeof atob !== "undefined"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("binary");
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Encode a finished round's state into a URL-safe blob. */
export function encodeShare(state: ShareableState): string {
  const env = { v: SHARE_VERSION, m: state.mode, s: state };
  const json = JSON.stringify(env);
  const bytes = new TextEncoder().encode(json);
  return toBase64Url(bytes);
}

export type DecodedShare =
  | { kind: "gauntlet"; state: GauntletState }
  | { kind: "wolf"; state: WolfState }
  | { kind: "vegas"; state: VegasState }
  | { kind: "hollywood"; state: HollywoodState }
  | { kind: "lcr"; state: LcrState }
  | { kind: "matchplay"; state: MatchplayState }
  | { kind: "strokeplay"; state: StrokeplayState }
  | { kind: "stableford"; state: StablefordState }
  | { kind: "scramble"; state: ScrambleState };

/** Decode a share blob and validate the inner state against the mode schema. */
export function decodeShare(blob: string): DecodedShare | null {
  const bytes = fromBase64Url(blob);
  if (!bytes) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  const env = EnvelopeSchema.safeParse(parsed);
  if (!env.success) return null;
  const mode = env.data.m;
  const schema = SchemaByMode[mode];
  const state = schema.safeParse(env.data.s);
  if (!state.success) return null;
  // The schema's `mode` literal already pins the discriminator; cast through the
  // discriminated union so callers get a narrowed `state`.
  return { kind: mode, state: state.data } as DecodedShare;
}

export function buildShareUrl(origin: string, state: ShareableState): string {
  return `${origin}/golf/share/${encodeShare(state)}`;
}

/** Mode display metadata used by share UI. Keep in sync with each Shell header. */
export const MODE_LABELS: Record<GameMode, string> = {
  gauntlet: "GAUNTLET",
  wolf: "WOLF",
  vegas: "VEGAS",
  hollywood: "HOLLYWOOD",
  lcr: "LCR",
  matchplay: "Match Play",
  strokeplay: "Stroke Play",
  stableford: "Stableford",
  scramble: "Scramble",
};
