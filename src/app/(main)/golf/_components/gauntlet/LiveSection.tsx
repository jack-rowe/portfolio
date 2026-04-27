"use client";

import { HoleEntry } from "./HoleEntry";
import type { HoleScores, Player } from "../../_lib/gauntlet/types";

type Props = {
    players: Player[];
    holeNumber: number;
    onSubmit: (scores: HoleScores) => void;
};

export function LiveSection({ players, holeNumber, onSubmit }: Props) {
    return (
        <HoleEntry
            players={players}
            holeNumber={holeNumber}
            onSubmit={onSubmit}
        />
    );
}
