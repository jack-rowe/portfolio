"use client";

import { useCallback } from "react";
import { wolfEngine } from "../_lib/wolf/engine";
import type { HandicapStartOptions } from "../_lib/handicap";
import type { WolfHole, WolfPlayer, WolfState } from "../_lib/wolf/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseWolf = Omit<
  UseGame<WolfState, WolfHole, WolfPlayer, HandicapStartOptions>,
  "startGame"
> & {
  startGame: (names: string[], options?: HandicapStartOptions) => void;
};

export function useWolf(): UseWolf {
  const game = useGame(wolfEngine);
  const startGame = useCallback(
    (names: string[], options: HandicapStartOptions = {}) => {
      game.startGame(names, options);
    },
    [game],
  );
  return { ...game, startGame };
}
