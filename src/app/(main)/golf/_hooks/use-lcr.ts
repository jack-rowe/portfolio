"use client";

import { useCallback } from "react";
import { lcrEngine } from "../_lib/lcr/engine";
import type { HandicapStartOptions } from "../_lib/handicap";
import type { LcrHole, LcrPlayer, LcrState } from "../_lib/lcr/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseLcr = Omit<
  UseGame<LcrState, LcrHole, LcrPlayer, HandicapStartOptions>,
  "startGame"
> & {
  startGame: (names: string[], options?: HandicapStartOptions) => void;
};

export function useLcr(): UseLcr {
  const game = useGame(lcrEngine);
  const startGame = useCallback(
    (names: string[], options: HandicapStartOptions = {}) => {
      game.startGame(names, options);
    },
    [game],
  );
  return { ...game, startGame };
}
