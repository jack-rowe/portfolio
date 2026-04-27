"use client";

import { useCallback } from "react";
import { matchplayEngine } from "../_lib/matchplay/engine";
import type { HandicapStartOptions } from "../_lib/handicap";
import type {
  MatchplayHole,
  MatchplayPlayer,
  MatchplayState,
} from "../_lib/matchplay/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseMatchplay = Omit<
  UseGame<MatchplayState, MatchplayHole, MatchplayPlayer, HandicapStartOptions>,
  "startGame"
> & {
  startGame: (names: string[], options?: HandicapStartOptions) => void;
};

export function useMatchplay(): UseMatchplay {
  const game = useGame(matchplayEngine);
  const startGame = useCallback(
    (names: string[], options: HandicapStartOptions = {}) => {
      game.startGame(names, options);
    },
    [game],
  );
  return { ...game, startGame };
}
