"use client";

import { useCallback } from "react";
import { lcrEngine } from "../_lib/lcr/engine";
import type { LcrHole, LcrPlayer, LcrState } from "../_lib/lcr/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseLcr = Omit<
  UseGame<LcrState, LcrHole, LcrPlayer, void>,
  "startGame"
> & {
  startGame: (names: string[]) => void;
};

export function useLcr(): UseLcr {
  const game = useGame(lcrEngine);
  const startGame = useCallback(
    (names: string[]) => {
      game.startGame(names, undefined as never);
    },
    [game],
  );
  return { ...game, startGame };
}
