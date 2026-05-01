"use client";

import { GameOverBanner } from "./GameOverBanner";
import { HoleView } from "./HoleView";
import type { HoleScores, Player } from "../../_lib/gauntlet/types";
import type { HandicapConfig } from "../../_lib/handicap";

type Props = {
    playersEntering: Player[];
    playersAfter: Player[];
    holeNumber: number;
    scores: HoleScores;
    netScores: number[];
    onEdit: () => void;
    showGameOverBanner: boolean;
    gameOverPlayers: Player[];
    holesPlayed: number;
    onEditFinalHole: () => void;
    handicap?: HandicapConfig;
};

export function RecapSection({
    playersEntering,
    playersAfter,
    holeNumber,
    scores,
    netScores,
    onEdit,
    showGameOverBanner,
    gameOverPlayers,
    holesPlayed,
    onEditFinalHole,
    handicap,
}: Props) {
    return (
        <>
            {showGameOverBanner && (
                <GameOverBanner
                    players={gameOverPlayers}
                    holesPlayed={holesPlayed}
                    onEditFinalHole={onEditFinalHole}
                />
            )}
            <HoleView
                playersEntering={playersEntering}
                playersAfter={playersAfter}
                holeNumber={holeNumber}
                scores={scores}
                netScores={netScores}
                onEdit={onEdit}
                handicap={handicap}
            />
        </>
    );
}
