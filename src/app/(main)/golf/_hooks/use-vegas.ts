"use client";

import { vegasEngine } from "../_lib/vegas/engine";
import type {
  VegasHole,
  VegasPlayer,
  VegasStartOptions,
  VegasState,
} from "../_lib/vegas/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseVegas = UseGame<
  VegasState,
  VegasHole,
  VegasPlayer,
  VegasStartOptions
>;

export function useVegas(): UseVegas {
  return useGame(vegasEngine);
}
