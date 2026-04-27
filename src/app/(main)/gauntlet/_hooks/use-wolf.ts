"use client";

import { useCallback } from "react";
import { wolfEngine } from "../_lib/wolf/engine";
import type { WolfHole, WolfPlayer, WolfState } from "../_lib/wolf/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseWolf = Omit<
  UseGame<WolfState, WolfHole, WolfPlayer, void>,
  "startGame"
> & {
  startGame: (names: string[]) => void;
};

export function useWolf(): UseWolf {
  const game = useGame(wolfEngine);
  const startGame = useCallback(
    (names: string[]) => {
      game.startGame(names, undefined as never);
    },
    [game],
  );
  return { ...game, startGame };
}
