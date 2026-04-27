"use client";

import { useCallback } from "react";
import { matchplayEngine } from "../_lib/matchplay/engine";
import type {
  MatchplayHole,
  MatchplayPlayer,
  MatchplayState,
} from "../_lib/matchplay/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseMatchplay = Omit<
  UseGame<MatchplayState, MatchplayHole, MatchplayPlayer, void>,
  "startGame"
> & {
  startGame: (names: string[]) => void;
};

export function useMatchplay(): UseMatchplay {
  const game = useGame(matchplayEngine);
  const startGame = useCallback(
    (names: string[]) => {
      game.startGame(names, undefined as never);
    },
    [game],
  );
  return { ...game, startGame };
}
