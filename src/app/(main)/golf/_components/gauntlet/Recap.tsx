"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { applyHole, recompute, resetPlayers } from "../../_lib/gauntlet/engine";
import { getCourse } from "../../_lib/courseData";
import { netScoresForHole } from "../../_lib/handicap";
import type { GauntletState } from "../../_lib/gauntlet/types";
import { GAUNTLET_TOTAL_HOLES } from "../../_lib/gauntlet/types";
import { HoleNavigator } from "../HoleNavigator";
import { RecapHeader } from "../shared/RecapHeader";
import { GameOverBanner } from "./GameOverBanner";
import { HoleView } from "./HoleView";
import { Leaderboard } from "./Leaderboard";
import { Scorecard } from "./Scorecard";

type Props = { state: GauntletState };

export function GauntletRecap({ state }: Props) {
    const max = Math.max(0, state.holes.length - 1);
    const [viewedHole, setViewedHole] = useState(max);
    const clamped = Math.min(Math.max(viewedHole, 0), max);
    const totalHoles = state.finishedAt ?? GAUNTLET_TOTAL_HOLES;
    const course = getCourse(state.handicap?.courseId);

    const playersEntering = useMemo(() => {
        const initial = resetPlayers(state.players);
        return recompute(initial, state.holes.slice(0, clamped), {
            handicap: state.handicap,
            course,
        });
    }, [state, clamped, course]);

    if (state.holes.length === 0) {
        return (
            <div className="min-h-screen px-4 max-w-2xl mx-auto pb-10">
                <RecapHeader
                    icon={
                        <Trophy
                            aria-hidden="true"
                            className="w-5 h-5 text-primary"
                        />
                    }
                    title="GAUNTLET"
                />
                <p className="text-center text-muted-foreground py-12">
                    No holes recorded.
                </p>
            </div>
        );
    }

    const playersAfter = applyHole(playersEntering, state.holes[clamped], clamped, {
        handicap: state.handicap,
        course,
    });
    const showBanner = clamped === state.holes.length - 1;

    return (
        <div className="min-h-screen px-4 max-w-2xl mx-auto pb-10">
            <RecapHeader
                icon={
                    <Trophy
                        aria-hidden="true"
                        className="w-5 h-5 text-primary"
                    />
                }
                title="GAUNTLET"
            />
            <div className="space-y-4">
                <HoleNavigator
                    holeNumber={clamped + 1}
                    totalHoles={totalHoles}
                    label="Final"
                    canPrev={clamped > 0}
                    canNext={clamped < max}
                    onPrev={() => {
                        setViewedHole(clamped - 1);
                    }}
                    onNext={() => {
                        setViewedHole(clamped + 1);
                    }}
                />
                {showBanner && (
                    <GameOverBanner
                        players={state.players}
                        holesPlayed={state.holes.length}
                    />
                )}
                <HoleView
                    playersEntering={playersEntering}
                    playersAfter={playersAfter}
                    holeNumber={clamped + 1}
                    scores={state.holes[clamped]}
                    netScores={netScoresForHole(
                        state.holes[clamped],
                        clamped,
                        state.handicap,
                        course,
                    )}
                    handicap={state.handicap}
                />
                <Leaderboard players={state.players} isGameOver={true} />
                <Scorecard
                    players={state.players}
                    holes={state.holes}
                    activeHoleIndex={clamped}
                    onSelectHole={setViewedHole}
                    handicap={state.handicap}
                />
            </div>
        </div>
    );
}
