"use client";

import { HoleEntry } from "./HoleEntry";
import type { HandicapConfig } from "../../_lib/handicap";
import type { HoleScores, Player } from "../../_lib/gauntlet/types";

type Props = {
    players: Player[];
    holeNumber: number;
    onSubmit: (scores: HoleScores) => void;
    handicap?: HandicapConfig;
};

export function LiveSection({ players, holeNumber, onSubmit, handicap }: Props) {
    return (
        <HoleEntry
            players={players}
            holeNumber={holeNumber}
            onSubmit={onSubmit}
            handicap={handicap}
        />
    );
}
