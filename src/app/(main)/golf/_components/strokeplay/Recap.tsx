"use client";

import { useState } from "react";
import { Goal } from "lucide-react";
import { getCourse } from "../../_lib/courseData";
import type { StrokeplayState } from "../../_lib/strokeplay/types";
import { STROKEPLAY_TOTAL_HOLES } from "../../_lib/strokeplay/types";
import { HoleNavigator } from "../HoleNavigator";
import { RecapHeader } from "../shared/RecapHeader";
import { GameOverBanner } from "./GameOverBanner";
import { HoleView } from "./HoleView";
import { Leaderboard } from "./Leaderboard";
import { Scorecard } from "./Scorecard";

type Props = { state: StrokeplayState };

export function StrokeplayRecap({ state }: Props) {
    const max = Math.max(0, state.holes.length - 1);
    const [viewedHole, setViewedHole] = useState(max);
    const clamped = Math.min(Math.max(viewedHole, 0), max);
    const totalHoles = state.finishedAt ?? STROKEPLAY_TOTAL_HOLES;
    const course = getCourse(state.handicap?.courseId);

    const header = (
        <RecapHeader
            icon={<Goal aria-hidden="true" className="w-5 h-5 text-primary" />}
            title="Stroke Play"
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
                        holes={state.holes}
                        course={course}
                    />
                )}
                <HoleView
                    players={state.players}
                    holeIndex={clamped}
                    hole={state.holes[clamped]}
                    handicap={state.handicap}
                />
                <Leaderboard
                    players={state.players}
                    holes={state.holes}
                    isGameOver={true}
                    course={course}
                />
                <Scorecard
                    players={state.players}
                    holes={state.holes}
                    activeHoleIndex={clamped}
                    onSelectHole={setViewedHole}
                    course={course}
                    handicap={state.handicap}
                />
            </div>
        </div>
    );
}
