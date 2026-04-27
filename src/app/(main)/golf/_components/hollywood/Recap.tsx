"use client";

import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCourse } from "../../_lib/courseData";
import { segmentScores, SEGMENTS } from "../../_lib/hollywood/engine";
import type { HollywoodState } from "../../_lib/hollywood/types";
import { HOLLYWOOD_TOTAL_HOLES } from "../../_lib/hollywood/types";
import { HoleNavigator } from "../HoleNavigator";
import { RecapHeader } from "../shared/RecapHeader";
import { GenericLeaderboard } from "../shared/GenericLeaderboard";
import { GameOverBanner } from "./GameOverBanner";
import { HoleView } from "./HoleView";
import { Scorecard } from "./Scorecard";

const SEGMENT_LABELS = ["Front 6", "Middle 6", "Back 6"];

type Props = { state: HollywoodState };

export function HollywoodRecap({ state }: Props) {
    const max = Math.max(0, state.holes.length - 1);
    const [viewedHole, setViewedHole] = useState(max);
    const clamped = Math.min(Math.max(viewedHole, 0), max);
    const totalHoles = state.finishedAt ?? HOLLYWOOD_TOTAL_HOLES;

    const header = (
        <RecapHeader
            icon={
                <Clapperboard
                    aria-hidden="true"
                    className="w-5 h-5 text-primary"
                />
            }
            title="HOLLYWOOD"
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

    const segs = segmentScores(state.holes, {
        handicap: state.handicap,
        course: getCourse(state.handicap?.courseId),
    });
    const showBanner = clamped === state.holes.length - 1;

    return (
        <div className="min-h-screen px-4 max-w-2xl mx-auto pb-10">
            {header}
            <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Partner rotation
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {SEGMENTS.map((s, idx) => {
                            const aNames = s.teamA.map(
                                (i) => state.players[i].name,
                            );
                            const bNames = s.teamB.map(
                                (i) => state.players[i].name,
                            );
                            const startHole = idx * 6 + 1;
                            const endHole = startHole + 5;
                            const seg = segs[idx];
                            return (
                                <div
                                    key={`seg-${String(idx)}`}
                                    className={cn(
                                        "rounded-md border border-border px-2 py-2",
                                    )}
                                >
                                    <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                                        {SEGMENT_LABELS[idx]} · {startHole}-
                                        {endHole}
                                    </p>
                                    <ul className="font-clash text-xs font-bold leading-tight space-y-0.5 break-words">
                                        {aNames.map((name) => (
                                            <li key={`a-${name}`}>{name}</li>
                                        ))}
                                    </ul>
                                    <p className="text-[10px] text-muted-foreground my-0.5">
                                        vs
                                    </p>
                                    <ul className="font-clash text-xs font-bold leading-tight space-y-0.5 break-words">
                                        {bNames.map((name) => (
                                            <li key={`b-${name}`}>{name}</li>
                                        ))}
                                    </ul>
                                    <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                                        {seg.teamAWins}–{seg.teamBWins}
                                        {seg.ties > 0
                                            ? ` (${String(seg.ties)}T)`
                                            : ""}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

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
                    unitLabel={(p) => (p === 1 ? "hole" : "holes")}
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
