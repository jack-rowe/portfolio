"use client";

import { useMemo, useState } from "react";
import { Flag, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGauntlet } from "../../_hooks/use-gauntlet";
import { applyHole, recompute, resetPlayers } from "../../_lib/gauntlet/engine";
import { getCourse } from "../../_lib/courseData";
import { netScoresForHole } from "../../_lib/handicap";
import type { GauntletState, HoleScores } from "../../_lib/gauntlet/types";
import { GAUNTLET_TOTAL_HOLES as TOTAL_HOLES } from "../../_lib/gauntlet/types";
import { EditHoleDialog } from "./EditHoleDialog";
import { EndRoundDialog } from "../EndRoundDialog";
import { HoleNavigator } from "../HoleNavigator";
import { Leaderboard } from "./Leaderboard";
import { LiveSection } from "./LiveSection";
import { RecapSection } from "./RecapSection";
import { ResetDialog } from "../ResetDialog";
import { Scorecard } from "./Scorecard";

type Props = {
    onResetToSetup: () => void;
};

function computeMaxIndex(
    state: GauntletState | null,
    isGameOver: boolean,
): number {
    if (!state) return 0;
    if (isGameOver) return Math.max(0, state.holes.length - 1);
    return state.holes.length;
}

function computeNavLabel(
    isLiveEntry: boolean,
    isGameOver: boolean,
): "Now playing" | "Viewing" | "Final" {
    if (isLiveEntry) return "Now playing";
    if (isGameOver) return "Final";
    return "Viewing";
}

export function GauntletShell({ onResetToSetup }: Props) {
    const {
        state,
        submitHole,
        editHole,
        endRound,
        renamePlayer,
        resetGame,
        isGameOver,
        holeNumber,
    } = useGauntlet();

    const [viewedHole, setViewedHole] = useState(0);
    const [editingHole, setEditingHole] = useState<number | null>(null);
    const [endRoundOpen, setEndRoundOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);

    const maxIndex = computeMaxIndex(state, isGameOver);
    const clampedViewedHole = state
        ? Math.min(Math.max(viewedHole, 0), maxIndex)
        : 0;

    const playersEntering = useMemo(() => {
        if (!state) return [];
        const initial = resetPlayers(state.players);
        const ctx = {
            handicap: state.handicap,
            course: getCourse(state.handicap?.courseId),
        };
        return recompute(initial, state.holes.slice(0, clampedViewedHole), ctx);
    }, [state, clampedViewedHole]);

    if (!state) return null;

    const totalHoles = state.finishedAt ?? TOTAL_HOLES;
    const isLiveEntry =
        !isGameOver && clampedViewedHole === state.holes.length;
    const viewedHoleNumber = clampedViewedHole + 1;
    const canPrev = clampedViewedHole > 0;
    const canNext = clampedViewedHole < maxIndex;
    const navLabel = computeNavLabel(isLiveEntry, isGameOver);

    const goPrev = () => {
        if (canPrev) setViewedHole(clampedViewedHole - 1);
    };
    const goNext = () => {
        if (canNext) setViewedHole(clampedViewedHole + 1);
    };

    const handleSubmit = (scores: HoleScores) => {
        submitHole(scores);
        setViewedHole(clampedViewedHole + 1);
    };

    const handleSaveEdit = (holeIndex: number, scores: HoleScores) => {
        editHole(holeIndex, scores);
        toast.success(`Hole ${String(holeIndex + 1)} updated`);
    };

    const playersAfterViewed = isLiveEntry
        ? playersEntering
        : applyHole(
            playersEntering,
            state.holes[clampedViewedHole],
            clampedViewedHole,
            {
                handicap: state.handicap,
                course: getCourse(state.handicap?.courseId),
            },
        );

    const showGameOverBanner =
        isGameOver && clampedViewedHole === state.holes.length - 1;

    return (
        <div
            className={cn(
                "min-h-screen px-4 max-w-2xl mx-auto",
                isLiveEntry ? "pb-32 md:pb-10" : "pb-10",
            )}
        >
            <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border py-3 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Trophy
                        aria-hidden="true"
                        className="w-5 h-5 text-primary"
                    />
                    <span className="font-clash text-2xl font-bold tracking-tight">
                        GAUNTLET
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {!isGameOver && state.holes.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setEndRoundOpen(true);
                            }}
                            className="text-muted-foreground hover:text-foreground gap-1.5"
                        >
                            <Flag
                                aria-hidden="true"
                                className="w-3.5 h-3.5"
                            />{" "}
                            End round
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setResetOpen(true);
                        }}
                        className="text-muted-foreground hover:text-foreground gap-1.5"
                    >
                        <RotateCcw
                            aria-hidden="true"
                            className="w-3.5 h-3.5"
                        />{" "}
                        New game
                    </Button>
                </div>
            </header>

            <div className="space-y-4">
                <HoleNavigator
                    holeNumber={viewedHoleNumber}
                    totalHoles={totalHoles}
                    label={navLabel}
                    canPrev={canPrev}
                    canNext={canNext}
                    onPrev={goPrev}
                    onNext={goNext}
                />

                {isLiveEntry ? (
                    <LiveSection
                        players={playersEntering}
                        holeNumber={holeNumber}
                        onSubmit={handleSubmit}
                    />
                ) : (
                    <RecapSection
                        playersEntering={playersEntering}
                        playersAfter={playersAfterViewed}
                        holeNumber={viewedHoleNumber}
                        scores={state.holes[clampedViewedHole]}
                        netScores={netScoresForHole(
                            state.holes[clampedViewedHole],
                            clampedViewedHole,
                            state.handicap,
                            getCourse(state.handicap?.courseId),
                        )}
                        onEdit={() => {
                            setEditingHole(clampedViewedHole);
                        }}
                        showGameOverBanner={showGameOverBanner}
                        gameOverPlayers={state.players}
                        holesPlayed={state.holes.length}
                        onEditFinalHole={() => {
                            setEditingHole(state.holes.length - 1);
                        }}
                    />
                )}

                <Leaderboard
                    players={state.players}
                    isGameOver={isGameOver}
                    onRename={renamePlayer}
                />

                <Scorecard
                    players={state.players}
                    holes={state.holes}
                    activeHoleIndex={isLiveEntry ? null : clampedViewedHole}
                    onSelectHole={setViewedHole}
                    handicap={state.handicap}
                />
            </div>

            <EditHoleDialog
                open={editingHole !== null}
                onOpenChange={(open) => {
                    if (!open) setEditingHole(null);
                }}
                holeIndex={editingHole}
                players={state.players}
                initialScores={
                    editingHole === null
                        ? null
                        : (state.holes[editingHole] ?? null)
                }
                onSave={handleSaveEdit}
            />

            <EndRoundDialog
                open={endRoundOpen}
                onOpenChange={setEndRoundOpen}
                holesCompleted={state.holes.length}
                onConfirm={() => {
                    endRound();
                    setEndRoundOpen(false);
                    setViewedHole(state.holes.length - 1);
                    toast.success(
                        `Round ended after hole ${String(state.holes.length)}`,
                    );
                }}
            />

            <ResetDialog
                open={resetOpen}
                onOpenChange={setResetOpen}
                onConfirm={() => {
                    resetGame();
                    setViewedHole(0);
                    setResetOpen(false);
                    onResetToSetup();
                    toast.success("New game started");
                }}
            />
        </div>
    );
}
