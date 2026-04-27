"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import type { ScrambleState } from "../../_lib/scramble/types";
import { SCRAMBLE_TOTAL_HOLES } from "../../_lib/scramble/types";
import { HoleNavigator } from "../HoleNavigator";
import { RecapHeader } from "../shared/RecapHeader";
import { GameOverBanner } from "./GameOverBanner";
import { HoleView } from "./HoleView";
import { Leaderboard } from "./Leaderboard";
import { Scorecard } from "./Scorecard";

type Props = { state: ScrambleState };

function formatLabel(state: ScrambleState): string {
    const fmt = state.format === "matchplay" ? "Match" : "Stroke";
    return `${state.layout} · ${fmt}`;
}

export function ScrambleRecap({ state }: Props) {
    const max = Math.max(0, state.holes.length - 1);
    const [viewedHole, setViewedHole] = useState(max);
    const clamped = Math.min(Math.max(viewedHole, 0), max);
    const totalHoles = state.finishedAt ?? SCRAMBLE_TOTAL_HOLES;

    const header = (
        <RecapHeader
            icon={<Users aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />}
            title="Scramble"
            subtitle={formatLabel(state)}
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
                {showBanner && <GameOverBanner state={state} />}
                <HoleView
                    state={state}
                    players={state.players}
                    holeIndex={clamped}
                    hole={state.holes[clamped]}
                />
                <Leaderboard state={state} isGameOver={true} />
                <Scorecard
                    state={state}
                    activeHoleIndex={clamped}
                    onSelectHole={setViewedHole}
                />
            </div>
        </div>
    );
}
