"use client";

import { useState } from "react";
import { Flag, Goal, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStrokeplay } from "../../_hooks/use-strokeplay";
import { getCourse } from "../../_lib/courseData";
import type {
    StrokeplayHole,
    StrokeplayState,
} from "../../_lib/strokeplay/types";
import { STROKEPLAY_TOTAL_HOLES } from "../../_lib/strokeplay/types";
import { EndRoundDialog } from "../EndRoundDialog";
import { HoleNavigator } from "../HoleNavigator";
import { ResetDialog } from "../ResetDialog";
import { EditHoleDialog } from "./EditHoleDialog";
import { GameOverBanner } from "./GameOverBanner";
import { HoleEntry } from "./HoleEntry";
import { HoleView } from "./HoleView";
import { Leaderboard } from "./Leaderboard";
import { Scorecard } from "./Scorecard";
import { ShareButton } from "../shared/ShareButton";

type Props = {
    onResetToSetup: () => void;
};

function computeMaxIndex(
    state: StrokeplayState | null,
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

export function StrokeplayShell({ onResetToSetup }: Props) {
    const {
        state,
        submitHole,
        editHole,
        endRound,
        renamePlayer,
        resetGame,
        isGameOver,
        holeNumber,
    } = useStrokeplay();

    const [viewedHole, setViewedHole] = useState(0);
    const [editingHole, setEditingHole] = useState<number | null>(null);
    const [endRoundOpen, setEndRoundOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);

    const maxIndex = computeMaxIndex(state, isGameOver);
    const clampedViewedHole = state
        ? Math.min(Math.max(viewedHole, 0), maxIndex)
        : 0;

    if (!state) return null;

    const course = getCourse(state.handicap?.courseId);

    const totalHoles = state.finishedAt ?? STROKEPLAY_TOTAL_HOLES;
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

    const handleSubmit = (hole: StrokeplayHole) => {
        submitHole(hole);
        setViewedHole(clampedViewedHole + 1);
    };

    const handleSaveEdit = (holeIndex: number, hole: StrokeplayHole) => {
        editHole(holeIndex, hole);
        toast.success(`Hole ${String(holeIndex + 1)} updated`);
    };

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
                    <Goal aria-hidden="true" className="w-5 h-5 text-primary" />
                    <span className="font-clash text-2xl font-bold tracking-tight">
                        Stroke Play
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
                            <Flag aria-hidden="true" className="w-3.5 h-3.5" />{" "}
                            End round
                        </Button>
                    )}
                    {isGameOver && <ShareButton state={state} />}
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
                    <HoleEntry
                        key={`live-${String(state.holes.length)}`}
                        players={state.players}
                        holeNumber={holeNumber}
                        onSubmit={handleSubmit}
                    />
                ) : (
                    <>
                        {showGameOverBanner && (
                            <GameOverBanner
                                players={state.players}
                                holes={state.holes}
                                onEditFinalHole={() => {
                                    setEditingHole(state.holes.length - 1);
                                }}
                                course={course}
                            />
                        )}
                        <HoleView
                            players={state.players}
                            holeIndex={clampedViewedHole}
                            hole={state.holes[clampedViewedHole]}
                            handicap={state.handicap}
                            onEdit={() => {
                                setEditingHole(clampedViewedHole);
                            }}
                        />
                    </>
                )}

                <Leaderboard
                    players={state.players}
                    holes={state.holes}
                    isGameOver={isGameOver}
                    onRename={renamePlayer}
                    course={course}
                />

                <Scorecard
                    players={state.players}
                    holes={state.holes}
                    activeHoleIndex={isLiveEntry ? null : clampedViewedHole}
                    onSelectHole={setViewedHole}
                    course={course}
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
                initialHole={
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
                    toast.success("New round started");
                }}
            />
        </div>
    );
}
