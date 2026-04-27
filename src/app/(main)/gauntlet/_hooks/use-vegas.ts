"use client";

import { vegasEngine } from "../_lib/vegas/engine";
import type {
  VegasHole,
  VegasPlayer,
  VegasState,
  VegasTeams,
} from "../_lib/vegas/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseVegas = UseGame<VegasState, VegasHole, VegasPlayer, VegasTeams>;

export function useVegas(): UseVegas {
  return useGame(vegasEngine);
}
