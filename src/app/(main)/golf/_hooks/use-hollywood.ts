"use client";

import { useCallback } from "react";
import { hollywoodEngine } from "../_lib/hollywood/engine";
import type {
  HollywoodHole,
  HollywoodPlayer,
  HollywoodState,
} from "../_lib/hollywood/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseHollywood = Omit<
  UseGame<HollywoodState, HollywoodHole, HollywoodPlayer, void>,
  "startGame"
> & {
  startGame: (names: string[]) => void;
};

export function useHollywood(): UseHollywood {
  const game = useGame(hollywoodEngine);
  const startGame = useCallback(
    (names: string[]) => {
      game.startGame(names, undefined as never);
    },
    [game],
  );
  return { ...game, startGame };
}
