"use client";

import { useCallback } from "react";
import { stablefordEngine } from "../_lib/stableford/engine";
import type {
  StablefordHole,
  StablefordPlayer,
  StablefordStartOptions,
  StablefordState,
} from "../_lib/stableford/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseStableford = Omit<
  UseGame<
    StablefordState,
    StablefordHole,
    StablefordPlayer,
    StablefordStartOptions
  >,
  "startGame"
> & {
  startGame: (names: string[], options: StablefordStartOptions) => void;
};

export function useStableford(): UseStableford {
  const game = useGame(stablefordEngine);
  const startGame = useCallback(
    (names: string[], options: StablefordStartOptions) => {
      game.startGame(names, options);
    },
    [game],
  );
  return { ...game, startGame };
}
