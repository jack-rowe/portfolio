"use client";

import { useState } from "react";
import { Flag, RotateCcw, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLcr } from "../../_hooks/use-lcr";
import type { LcrHole, LcrState } from "../../_lib/lcr/types";
import { LCR_TOTAL_HOLES } from "../../_lib/lcr/types";
import { EndRoundDialog } from "../EndRoundDialog";
import { HoleNavigator } from "../HoleNavigator";
import { ResetDialog } from "../ResetDialog";
import { GenericLeaderboard } from "../shared/GenericLeaderboard";
import { EditHoleDialog } from "./EditHoleDialog";
import { GameOverBanner } from "./GameOverBanner";
import { HoleEntry } from "./HoleEntry";
import { HoleView } from "./HoleView";
import { Scorecard } from "./Scorecard";

type Props = {
    onResetToSetup: () => void;
};

function computeMaxIndex(state: LcrState | null, isGameOver: boolean): number {
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

export function LcrShell({ onResetToSetup }: Props) {
    const {
        state,
        submitHole,
        editHole,
        endRound,
        renamePlayer,
        resetGame,
        isGameOver,
        holeNumber,
    } = useLcr();

    const [viewedHole, setViewedHole] = useState(0);
    const [editingHole, setEditingHole] = useState<number | null>(null);
    const [endRoundOpen, setEndRoundOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);

    const maxIndex = computeMaxIndex(state, isGameOver);
    const clampedViewedHole = state
        ? Math.min(Math.max(viewedHole, 0), maxIndex)
        : 0;

    if (!state) return null;

    const totalHoles = state.finishedAt ?? LCR_TOTAL_HOLES;
    const isLiveEntry = !isGameOver && clampedViewedHole === state.holes.length;
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

    const handleSubmit = (hole: LcrHole) => {
        submitHole(hole);
        setViewedHole(clampedViewedHole + 1);
    };

    const handleSaveEdit = (holeIndex: number, hole: LcrHole) => {
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
                    <Target aria-hidden="true" className="w-5 h-5 text-primary" />
                    <span className="font-clash text-2xl font-bold tracking-tight">
                        LCR
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setResetOpen(true);
                        }}
                        className="text-muted-foreground hover:text-foreground gap-1.5"
                    >
                        <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />{" "}
                        New game
                    </Button>
                </div>
            </header>

            <div className="space-y-4">
                {!isGameOver && isLiveEntry && (
                    <div className="rounded-lg border border-border bg-card p-3 text-center">
                        <p className="text-[11px] text-muted-foreground">
                            Pick the Center based on tee-shot location.
                            <br />
                            Center wins solo: +2. Outside best ball wins: +1 each.
                        </p>
                    </div>
                )}

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
                                holesPlayed={state.holes.length}
                                onEditFinalHole={() => {
                                    setEditingHole(state.holes.length - 1);
                                }}
                            />
                        )}
                        <HoleView
                            players={state.players}
                            holeIndex={clampedViewedHole}
                            hole={state.holes[clampedViewedHole]}
                            onEdit={() => {
                                setEditingHole(clampedViewedHole);
                            }}
                        />
                    </>
                )}

                <GenericLeaderboard
                    players={state.players}
                    isGameOver={isGameOver}
                    onRename={renamePlayer}
                />

                <Scorecard
                    players={state.players}
                    holes={state.holes}
                    activeHoleIndex={isLiveEntry ? null : clampedViewedHole}
                    onSelectHole={setViewedHole}
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
                    toast.success("New game started");
                }}
            />
        </div>
    );
}
