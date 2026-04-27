"use client";

import { useState } from "react";
import { Dice5 } from "lucide-react";
import type { VegasState } from "../../_lib/vegas/types";
import { VEGAS_TOTAL_HOLES } from "../../_lib/vegas/types";
import { HoleNavigator } from "../HoleNavigator";
import { RecapHeader } from "../shared/RecapHeader";
import { GenericLeaderboard } from "../shared/GenericLeaderboard";
import { GameOverBanner } from "./GameOverBanner";
import { HoleView } from "./HoleView";
import { Scorecard } from "./Scorecard";
import { TeamDisplay } from "./TeamPicker";

type Props = { state: VegasState };

export function VegasRecap({ state }: Props) {
    const max = Math.max(0, state.holes.length - 1);
    const [viewedHole, setViewedHole] = useState(max);
    const clamped = Math.min(Math.max(viewedHole, 0), max);
    const totalHoles = state.finishedAt ?? VEGAS_TOTAL_HOLES;

    const header = (
        <RecapHeader
            icon={<Dice5 aria-hidden="true" className="w-5 h-5 text-primary" />}
            title="VEGAS"
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
                <TeamDisplay players={state.players} teams={state.teams} />
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
                    teams={state.teams}
                    hole={state.holes[clamped]}
                    holeIndex={clamped}
                    handicap={state.handicap}
                />
                <GenericLeaderboard
                    players={state.players}
                    isGameOver={true}
                />
                <Scorecard
                    players={state.players}
                    teams={state.teams}
                    holes={state.holes}
                    activeHoleIndex={clamped}
                    onSelectHole={setViewedHole}
                    handicap={state.handicap}
                />
            </div>
        </div>
    );
}
