"use client";

import { useCallback } from "react";
import { gauntletEngine } from "../_lib/gauntlet/engine";
import { saveLastNames } from "../_lib/storage";
import type { GauntletState, HoleScores, Player } from "../_lib/gauntlet/types";
import type { UseGame } from "./use-game";
import { useGame } from "./use-game";

export type UseGauntlet = Omit<
  UseGame<GauntletState, HoleScores, Player, void>,
  "startGame"
> & {
  startGame: (names: string[]) => void;
};

export function useGauntlet(): UseGauntlet {
  const game = useGame(gauntletEngine);
  const startGame = useCallback(
    (names: string[]) => {
      const trimmed = names.map(
        (n, i) => n.trim() || `Player ${String(i + 1)}`,
      );
      saveLastNames(trimmed);
      game.startGame(trimmed, undefined as never);
    },
    [game],
  );
  return { ...game, startGame };
}
