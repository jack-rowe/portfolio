"use client";

import { useState } from "react";
import { Flag, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useScramble } from "../../_hooks/use-scramble";
import type {
    ScrambleHole,
    ScrambleState,
} from "../../_lib/scramble/types";
import { SCRAMBLE_TOTAL_HOLES } from "../../_lib/scramble/types";
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
    state: ScrambleState | null,
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

function formatLabel(state: ScrambleState): string {
    const fmt = state.format === "matchplay" ? "Match" : "Stroke";
    return `${state.layout} · ${fmt}`;
}

export function ScrambleShell({ onResetToSetup }: Props) {
    const {
        state,
        submitHole,
        editHole,
        endRound,
        resetGame,
        isGameOver,
        holeNumber,
    } = useScramble();

    const [viewedHole, setViewedHole] = useState(0);
    const [editingHole, setEditingHole] = useState<number | null>(null);
    const [endRoundOpen, setEndRoundOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);

    const maxIndex = computeMaxIndex(state, isGameOver);
    const clampedViewedHole = state
        ? Math.min(Math.max(viewedHole, 0), maxIndex)
        : 0;

    if (!state) return null;

    const totalHoles = state.finishedAt ?? SCRAMBLE_TOTAL_HOLES;
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

    const handleSubmit = (hole: ScrambleHole) => {
        submitHole(hole);
        setViewedHole(clampedViewedHole + 1);
    };

    const handleSaveEdit = (holeIndex: number, hole: ScrambleHole) => {
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
                <div className="flex items-center gap-3 min-w-0">
                    <Users
                        aria-hidden="true"
                        className="w-5 h-5 text-primary shrink-0"
                    />
                    <div className="min-w-0">
                        <span className="font-clash text-2xl font-bold tracking-tight block leading-none">
                            Scramble
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                            {formatLabel(state)}
                        </span>
                    </div>
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
                        teams={state.teams}
                        holeNumber={holeNumber}
                        handicap={state.handicap}
                        onSubmit={handleSubmit}
                    />
                ) : (
                    <>
                        {showGameOverBanner && (
                            <GameOverBanner
                                state={state}
                                onEditFinalHole={() => {
                                    setEditingHole(state.holes.length - 1);
                                }}
                            />
                        )}
                        <HoleView
                            state={state}
                            players={state.players}
                            holeIndex={clampedViewedHole}
                            hole={state.holes[clampedViewedHole]}
                            onEdit={() => {
                                setEditingHole(clampedViewedHole);
                            }}
                        />
                    </>
                )}

                <Leaderboard state={state} isGameOver={isGameOver} />

                <Scorecard
                    state={state}
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
                teams={state.teams}
                initialHole={
                    editingHole === null
                        ? null
                        : (state.holes[editingHole] ?? null)
                }
                onSave={handleSaveEdit}
                handicap={state.handicap}
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
