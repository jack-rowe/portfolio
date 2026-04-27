"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { recompute, resetPlayers } from "../../_lib/wolf/engine";
import { getCourse } from "../../_lib/courseData";
import type { WolfState } from "../../_lib/wolf/types";
import { WOLF_TOTAL_HOLES } from "../../_lib/wolf/types";
import { HoleNavigator } from "../HoleNavigator";
import { RecapHeader } from "../shared/RecapHeader";
import { GameOverBanner } from "./GameOverBanner";
import { HoleView } from "./HoleView";
import { Leaderboard } from "./Leaderboard";
import { Scorecard } from "./Scorecard";

type Props = { state: WolfState };

export function WolfRecap({ state }: Props) {
    const max = Math.max(0, state.holes.length - 1);
    const [viewedHole, setViewedHole] = useState(max);
    const clamped = Math.min(Math.max(viewedHole, 0), max);
    const totalHoles = state.finishedAt ?? WOLF_TOTAL_HOLES;
    const course = getCourse(state.handicap?.courseId);

    const playersForView = useMemo(() => {
        const initial = resetPlayers(state.players);
        return recompute(initial, state.holes.slice(0, clamped), {
            handicap: state.handicap,
            course,
        });
    }, [state, clamped, course]);

    const header = (
        <RecapHeader
            icon={
                <Trophy aria-hidden="true" className="w-5 h-5 text-primary" />
            }
            title="WOLF"
        />
    );

    if (state.holes.length === 0) {
        return (
            <div className="min-h-screen px-4 max-w-2xl mx-auto pb-10">
                {header}
                <p className="text-center text-muted-foreground py-12">
                    No holes recorded.
                </p>
            </div>
        );
    }

    const showBanner = clamped === state.holes.length - 1;

    return (
        <div className="min-h-screen px-4 max-w-2xl mx-auto pb-10">
            {header}
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
                    players={playersForView}
                    hole={state.holes[clamped]}
                    holeNumber={clamped + 1}
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
