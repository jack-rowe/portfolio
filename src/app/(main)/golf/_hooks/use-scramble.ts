"use client";

import { useCallback } from "react";
import { scrambleEngine } from "../_lib/scramble/engine";
import type {
  ScrambleHole,
  ScramblePlayer,
  ScrambleStartOptions,
  ScrambleState,
} from "../_lib/scramble/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseScramble = Omit<
  UseGame<ScrambleState, ScrambleHole, ScramblePlayer, ScrambleStartOptions>,
  "startGame"
> & {
  startGame: (names: string[], options: ScrambleStartOptions) => void;
};

export function useScramble(): UseScramble {
  const game = useGame(scrambleEngine);
  const startGame = useCallback(
    (names: string[], options: ScrambleStartOptions) => {
      game.startGame(names, options);
    },
    [game],
  );
  return { ...game, startGame };
}
