"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import type { MatchplayState } from "../../_lib/matchplay/types";
import { MATCHPLAY_TOTAL_HOLES } from "../../_lib/matchplay/types";
import { HoleNavigator } from "../HoleNavigator";
import { RecapHeader } from "../shared/RecapHeader";
import { GenericLeaderboard } from "../shared/GenericLeaderboard";
import { GameOverBanner } from "./GameOverBanner";
import { HoleView } from "./HoleView";
import { Scorecard } from "./Scorecard";

type Props = { state: MatchplayState };

const unitLabel = (n: number) => (n === 1 ? "hole" : "holes");

export function MatchplayRecap({ state }: Props) {
    const max = Math.max(0, state.holes.length - 1);
    const [viewedHole, setViewedHole] = useState(max);
    const clamped = Math.min(Math.max(viewedHole, 0), max);
    const totalHoles = state.finishedAt ?? MATCHPLAY_TOTAL_HOLES;

    const header = (
        <RecapHeader
            icon={
                <Swords aria-hidden="true" className="w-5 h-5 text-primary" />
            }
            title="Match Play"
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
                    players={state.players}
                    holeIndex={clamped}
                    hole={state.holes[clamped]}
                    handicap={state.handicap}
                />
                <GenericLeaderboard
                    players={state.players}
                    isGameOver={true}
                    unitLabel={unitLabel}
                />
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
