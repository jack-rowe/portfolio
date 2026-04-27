"use client";

import { useCallback } from "react";
import { strokeplayEngine } from "../_lib/strokeplay/engine";
import type {
  StrokeplayHole,
  StrokeplayPlayer,
  StrokeplayStartOptions,
  StrokeplayState,
} from "../_lib/strokeplay/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseStrokeplay = Omit<
  UseGame<
    StrokeplayState,
    StrokeplayHole,
    StrokeplayPlayer,
    StrokeplayStartOptions
  >,
  "startGame"
> & {
  startGame: (names: string[], handicaps: number[]) => void;
};

export function useStrokeplay(): UseStrokeplay {
  const game = useGame(strokeplayEngine);
  const startGame = useCallback(
    (names: string[], handicaps: number[]) => {
      game.startGame(names, { handicaps });
    },
    [game],
  );
  return { ...game, startGame };
}
