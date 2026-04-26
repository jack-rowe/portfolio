"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flag, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Setup } from "./_components/Setup";
import { HoleEntry } from "./_components/HoleEntry";
import { HoleView } from "./_components/HoleView";
import { Leaderboard } from "./_components/Leaderboard";
import { Scorecard } from "./_components/Scorecard";
import { GameOverBanner } from "./_components/GameOverBanner";
import { EditHoleDialog } from "./_components/EditHoleDialog";
import { EndRoundDialog } from "./_components/EndRoundDialog";
import { ResetDialog } from "./_components/ResetDialog";
import { useGauntlet } from "./_hooks/use-gauntlet";
import { applyHole, recompute, resetPlayers } from "./_lib/engine";
import type { HoleScores } from "./_lib/types";
import { TOTAL_HOLES } from "./_lib/types";

export default function GauntletPage() {
  const {
    hydrated,
    state,
    startGame,
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

  // Keep viewedHole in valid range. Live entry slot is at index holes.length
  // during play; when game is over, max valid index is holes.length - 1.
  const maxIndex = state
    ? isGameOver
      ? state.holes.length - 1
      : state.holes.length
    : 0;
  useEffect(() => {
    if (!state) return;
    if (viewedHole > maxIndex) setViewedHole(maxIndex);
    if (viewedHole < 0) setViewedHole(0);
  }, [state, viewedHole, maxIndex]);

  // Player state entering the currently viewed hole, derived from initial
  // players folded with all holes preceding `viewedHole`.
  const playersEntering = useMemo(() => {
    if (!state) return [];
    const initial = resetPlayers(state.players);
    return recompute(initial, state.holes.slice(0, viewedHole));
  }, [state, viewedHole]);

  if (!hydrated) {
    return <div className="min-h-screen" />;
  }

  if (!state) {
    return (
      <>
        <Setup onStart={startGame} />
        <Toaster />
      </>
    );
  }

  const totalHoles = state.finishedAt ?? TOTAL_HOLES;
  const isLiveEntry = !isGameOver && viewedHole === state.holes.length;
  const viewedHoleNumber = viewedHole + 1;
  const canPrev = viewedHole > 0;
  const canNext = viewedHole < maxIndex;

  const goPrev = () => {
    if (canPrev) setViewedHole(viewedHole - 1);
  };
  const goNext = () => {
    if (canNext) setViewedHole(viewedHole + 1);
  };

  const handleSubmit = (scores: HoleScores) => {
    submitHole(scores);
    // Stay on the next live-entry slot if not at the final hole.
    setViewedHole((prev) => prev + 1);
  };

  const handleSaveEdit = (holeIndex: number, scores: HoleScores) => {
    editHole(holeIndex, scores);
    toast.success(`Hole ${String(holeIndex + 1)} updated`);
  };

  // For HoleView we need the post-hole player state.
  const playersAfterViewed = isLiveEntry
    ? playersEntering
    : applyHole(playersEntering, state.holes[viewedHole]);

  return (
    <div className="min-h-screen px-4 pb-10 max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border py-3 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy aria-hidden="true" className="w-5 h-5 text-primary" />
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
              <Flag aria-hidden="true" className="w-3.5 h-3.5" /> End round
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
            <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" /> New game
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Hole navigator */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-2 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={goPrev}
            disabled={!canPrev}
            aria-label="Previous hole"
          >
            <ChevronLeft aria-hidden="true" className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {isLiveEntry ? "Now playing" : isGameOver ? "Final" : "Viewing"}
            </span>
            <span className="font-clash text-2xl font-bold mt-1">
              Hole {viewedHoleNumber}
              <span className="text-muted-foreground/60 text-base font-normal">
                {" "}
                / {totalHoles}
              </span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={goNext}
            disabled={!canNext}
            aria-label="Next hole"
          >
            <ChevronRight aria-hidden="true" className="w-5 h-5" />
          </Button>
        </div>

        {isGameOver && viewedHole === state.holes.length - 1 && (
          <GameOverBanner
            players={state.players}
            holesPlayed={state.holes.length}
            onEditFinalHole={() => {
              setEditingHole(state.holes.length - 1);
            }}
          />
        )}

        {isLiveEntry ? (
          <HoleEntry
            players={playersEntering}
            holeNumber={holeNumber}
            onSubmit={handleSubmit}
          />
        ) : (
          <HoleView
            playersEntering={playersEntering}
            playersAfter={playersAfterViewed}
            holeNumber={viewedHoleNumber}
            scores={state.holes[viewedHole]}
            onEdit={() => {
              setEditingHole(viewedHole);
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
          activeHoleIndex={isLiveEntry ? null : viewedHole}
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
        initialScores={
          editingHole === null ? null : (state.holes[editingHole] ?? null)
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
          toast.success(`Round ended after hole ${String(state.holes.length)}`);
        }}
      />

      <ResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        onConfirm={() => {
          resetGame();
          setViewedHole(0);
          setResetOpen(false);
          toast.success("New game started");
        }}
      />

      <Toaster />
    </div>
  );
}
