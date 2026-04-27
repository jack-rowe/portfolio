"use client";

import { useState } from "react";
import { Clapperboard, Flag, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHollywood } from "../../_hooks/use-hollywood";
import { getCourse } from "../../_lib/courseData";
import { segmentScores, SEGMENTS } from "../../_lib/hollywood/engine";
import type {
    HollywoodHole,
    HollywoodState,
} from "../../_lib/hollywood/types";
import { HOLLYWOOD_TOTAL_HOLES } from "../../_lib/hollywood/types";
import { EndRoundDialog } from "../EndRoundDialog";
import { HoleNavigator } from "../HoleNavigator";
import { ResetDialog } from "../ResetDialog";
import { GenericLeaderboard } from "../shared/GenericLeaderboard";
import { EditHoleDialog } from "./EditHoleDialog";
import { GameOverBanner } from "./GameOverBanner";
import { HoleEntry } from "./HoleEntry";
import { HoleView } from "./HoleView";
import { Scorecard } from "./Scorecard";

const SEGMENT_LABELS = ["Front 6", "Middle 6", "Back 6"];

type Props = {
    onResetToSetup: () => void;
};

function computeMaxIndex(
    state: HollywoodState | null,
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

export function HollywoodShell({ onResetToSetup }: Props) {
    const {
        state,
        submitHole,
        editHole,
        endRound,
        renamePlayer,
        resetGame,
        isGameOver,
        holeNumber,
    } = useHollywood();

    const [viewedHole, setViewedHole] = useState(0);
    const [editingHole, setEditingHole] = useState<number | null>(null);
    const [endRoundOpen, setEndRoundOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);

    const maxIndex = computeMaxIndex(state, isGameOver);
    const clampedViewedHole = state
        ? Math.min(Math.max(viewedHole, 0), maxIndex)
        : 0;

    if (!state) return null;

    const totalHoles = state.finishedAt ?? HOLLYWOOD_TOTAL_HOLES;
    const isLiveEntry = !isGameOver && clampedViewedHole === state.holes.length;
    const viewedHoleNumber = clampedViewedHole + 1;
    const canPrev = clampedViewedHole > 0;
    const canNext = clampedViewedHole < maxIndex;
    const navLabel = computeNavLabel(isLiveEntry, isGameOver);

    const segs = segmentScores(state.holes, {
        handicap: state.handicap,
        course: getCourse(state.handicap?.courseId),
    });

    const goPrev = () => {
        if (canPrev) setViewedHole(clampedViewedHole - 1);
    };
    const goNext = () => {
        if (canNext) setViewedHole(clampedViewedHole + 1);
    };

    const handleSubmit = (hole: HollywoodHole) => {
        submitHole(hole);
        setViewedHole(clampedViewedHole + 1);
    };

    const handleSaveEdit = (holeIndex: number, hole: HollywoodHole) => {
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
                    <Clapperboard
                        aria-hidden="true"
                        className="w-5 h-5 text-primary"
                    />
                    <span className="font-clash text-2xl font-bold tracking-tight">
                        HOLLYWOOD
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
                <SegmentSummary
                    players={state.players}
                    segs={segs}
                    holesPlayed={state.holes.length}
                />

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
                            handicap={state.handicap}
                        />
                    </>
                )}

                <GenericLeaderboard
                    players={state.players}
                    isGameOver={isGameOver}
                    onRename={renamePlayer}
                    unitLabel={(p) => (p === 1 ? "hole" : "holes")}
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

function SegmentSummary({
    players,
    segs,
    holesPlayed,
}: {
    players: { name: string }[];
    segs: ReturnType<typeof segmentScores>;
    holesPlayed: number;
}) {
    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Partner rotation
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SEGMENTS.map((s, idx) => {
                    const aNames = s.teamA.map((i) => players[i].name);
                    const bNames = s.teamB.map((i) => players[i].name);
                    const startHole = idx * 6 + 1;
                    const endHole = startHole + 5;
                    const active =
                        holesPlayed >= startHole - 1 && holesPlayed < endHole;
                    const seg = segs[idx];
                    return (
                        <div
                            key={`seg-${String(idx)}`}
                            className={cn(
                                "rounded-md border px-2 py-2",
                                active
                                    ? "border-primary/60 bg-primary/5"
                                    : "border-border",
                            )}
                        >
                            <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                                {SEGMENT_LABELS[idx]} · {startHole}-{endHole}
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
    );
}
