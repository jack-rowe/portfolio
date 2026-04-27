"use client";

import { GameOverBanner } from "./GameOverBanner";
import { HoleView } from "./HoleView";
import type { HoleScores, Player } from "../../_lib/gauntlet/types";

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
            />
        </>
    );
}
