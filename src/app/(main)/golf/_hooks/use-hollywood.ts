"use client";

import { useCallback } from "react";
import type { HandicapStartOptions } from "../_lib/handicap";
import { hollywoodEngine } from "../_lib/hollywood/engine";
import type {
  HollywoodHole,
  HollywoodPlayer,
  HollywoodState,
} from "../_lib/hollywood/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseHollywood = Omit<
  UseGame<HollywoodState, HollywoodHole, HollywoodPlayer, HandicapStartOptions>,
  "startGame"
> & {
  startGame: (names: string[], options?: HandicapStartOptions) => void;
};

export function useHollywood(): UseHollywood {
  const game = useGame(hollywoodEngine);
  const startGame = useCallback(
    (names: string[], options: HandicapStartOptions = {}) => {
      game.startGame(names, options);
    },
    [game],
  );
  return { ...game, startGame };
}
