"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, RotateCcw, ArrowRight, ArrowLeft, Plus, Minus } from "lucide-react";

type Player = {
  name: string;
  points: number;
  // index of player they are currently chasing
  targetIndex: number;
  // index of player they originally started chasing (used to detect a full lap)
  startTargetIndex: number;
};

type HoleScores = (number | null)[]; // length 4

type GauntletState = {
  players: Player[];
  holes: HoleScores[]; // each hole's 4 scores
  // per-hole snapshot of targets BEFORE the hole was played; length = holes.length + 1
  // targetsHistory[i] = targetIndex array entering hole i (1-based hole number i+1)
  targetsHistory: number[][];
};

const STORAGE_KEY = "gauntlet:v1";
const TOTAL_HOLES = 18;

function loadState(): GauntletState | null {
  if (globalThis.window === undefined) return null;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GauntletState;
  } catch {
    return null;
  }
}

function saveState(state: GauntletState | null) {
  if (globalThis.window === undefined) return;
  if (state === null) {
    globalThis.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Advance a single player's target by one slot, skipping themselves.
function advanceTarget(playerIdx: number, currentTarget: number, total: number) {
  let next = (currentTarget + 1) % total;
  if (next === playerIdx) next = (next + 1) % total;
  return next;
}

// Ordered list of targets the player chases in one lap of the gauntlet,
// starting from their startTargetIndex. Length = total - 1.
function chaseOrder(playerIdx: number, startTarget: number, total: number) {
  const order: number[] = [];
  let t = startTarget;
  for (let i = 0; i < total - 1; i++) {
    order.push(t);
    t = advanceTarget(playerIdx, t, total);
  }
  return order;
}

export default function GauntletPage() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<GauntletState | null>(null);

  // Setup form
  const [names, setNames] = useState<string[]>(["", "", "", ""]);

  // Active hole entry
  const [holeEntry, setHoleEntry] = useState<string[]>(["", "", "", ""]);
  // Prevents double-fire from touch → synthetic click on mobile
  const lastBumpRef = useRef<number>(0);

  useEffect(() => {
    const loaded = loadState();
    if (loaded) setState(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  const startGame = () => {
    const trimmed = names.map((n, i) => n.trim() || `Player ${i + 1}`);
    const players: Player[] = trimmed.map((name, i) => ({
      name,
      points: 0,
      targetIndex: (i + 1) % 4,
      startTargetIndex: (i + 1) % 4,
    }));
    const initial: GauntletState = {
      players,
      holes: [],
      targetsHistory: [players.map((p) => p.targetIndex)],
    };
    setState(initial);
    setHoleEntry(["", "", "", ""]);
  };

  const resetGame = () => {
    if (!confirm("Reset the game? This will clear all scores.")) return;
    setState(null);
    setNames(["", "", "", ""]);
    setHoleEntry(["", "", "", ""]);
  };

  const submitHole = () => {
    if (!state) return;
    if (state.holes.length >= TOTAL_HOLES) return;
    const scores = holeEntry.map(Number);
    if (scores.some((s) => !Number.isFinite(s) || s <= 0)) {
      alert("Enter a valid score for each player.");
      return;
    }

    const total = state.players.length;
    const newPlayers = state.players.map((p) => ({ ...p }));

    for (let i = 0; i < total; i++) {
      const me = newPlayers[i];
      const myScore = scores[i];
      const targetScore = scores[me.targetIndex];
      if (myScore < targetScore) {
        const next = advanceTarget(i, me.targetIndex, total);
        if (next === me.startTargetIndex) {
          // Completed a full gauntlet lap
          me.points += 1;
          // stay on startTarget to begin a new lap
          me.targetIndex = me.startTargetIndex;
        } else {
          me.targetIndex = next;
        }
      }
    }

    const newHoles = [...state.holes, scores as HoleScores];
    const newHistory = [
      ...state.targetsHistory,
      newPlayers.map((p) => p.targetIndex),
    ];

    setState({
      players: newPlayers,
      holes: newHoles,
      targetsHistory: newHistory,
    });
    setHoleEntry(["", "", "", ""]);
  };

  const undoLastHole = () => {
    if (!state || state.holes.length === 0) return;

    // Recompute from scratch using all but last hole
    const total = state.players.length;
    const players: Player[] = state.players.map((p, i) => ({
      name: p.name,
      points: 0,
      targetIndex: (i + 1) % total,
      startTargetIndex: (i + 1) % total,
    }));
    const lastHole = state.holes.at(-1) ?? [];
    const remaining = state.holes.slice(0, -1);
    const history: number[][] = [players.map((p) => p.targetIndex)];

    for (const scores of remaining) {
      for (let i = 0; i < total; i++) {
        const me = players[i];
        if ((scores[i] ?? 0) < (scores[me.targetIndex] ?? 0)) {
          const next = advanceTarget(i, me.targetIndex, total);
          if (next === me.startTargetIndex) {
            me.points += 1;
            me.targetIndex = me.startTargetIndex;
          } else {
            me.targetIndex = next;
          }
        }
      }
      history.push(players.map((p) => p.targetIndex));
    }

    setState({ players, holes: remaining, targetsHistory: history });
    // Pre-fill the score entry with the popped hole's values so the user can edit
    setHoleEntry(
      lastHole.map((s) => (s === null || s === undefined ? "" : String(s))),
    );
  };

  const leaderboard = useMemo(() => {
    if (!state) return [];
    const total = state.players.length;
    return state.players
      .map((p, i) => {
        const order = chaseOrder(i, p.startTargetIndex, total);
        const beaten = Math.max(0, order.indexOf(p.targetIndex));
        return { ...p, idx: i, beaten };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.beaten - a.beaten;
      });
  }, [state]);

  const holeNumber = (state?.holes.length ?? 0) + 1;
  const gameOver = (state?.holes.length ?? 0) >= TOTAL_HOLES;

  if (!hydrated) {
    return <div className="min-h-screen" />;
  }

  // SETUP SCREEN
  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-2">
              Golf Game
            </p>
            <h1 className="font-clash text-6xl md:text-7xl font-bold text-foreground leading-none">
              GAUNTLET
            </h1>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">
              Beat your target on a hole and advance to the next player. Work
              all the way around and score a point.
            </p>
          </div>

          {/* Player inputs */}
          <div className="space-y-3">
            {names.map((n, i) => (
              <div key={`name-slot-${String(i)}`} className="flex items-center gap-3">
                <span className="font-clash text-2xl font-bold text-primary w-6 shrink-0 leading-none">
                  {i + 1}
                </span>
                <Input
                  id={`p${i}`}
                  value={n}
                  placeholder={`Player ${i + 1}`}
                  className="h-12 text-base bg-card border-border focus-visible:ring-primary"
                  onChange={(e) => {
                    const next = [...names];
                    next[i] = e.target.value;
                    setNames(next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const inputs = Array.from(
                        document.querySelectorAll<HTMLInputElement>("input[data-name-input]"),
                      );
                      const idx = inputs.indexOf(e.target as HTMLInputElement);
                      if (idx >= 0 && idx < inputs.length - 1) {
                        inputs[idx + 1].focus();
                      } else {
                        startGame();
                      }
                    }
                  }}
                  data-name-input
                />
              </div>
            ))}
          </div>

          <Button
            className="w-full h-12 text-base font-semibold tracking-wide"
            onClick={startGame}
          >
            Start Game
          </Button>
        </div>
      </div>
    );
  }

  // GAME SCREEN
  return (
    <div className="min-h-screen px-4 pb-10 max-w-2xl mx-auto">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border py-3 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-clash text-2xl font-bold tracking-tight">GAUNTLET</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-sm text-muted-foreground">
            {gameOver ? (
              <span className="text-primary font-semibold">Final</span>
            ) : (
              <>
                Hole <span className="text-foreground font-semibold">{holeNumber}</span>
                <span className="text-muted-foreground/60"> / {String(TOTAL_HOLES)}</span>
              </>
            )}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={resetGame} className="text-muted-foreground hover:text-foreground gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> New game
        </Button>
      </div>

      <div className="space-y-4">
        {gameOver && (() => {
          const winner = leaderboard[0];
          const tiedOnPoints = leaderboard.filter((p) => p.points === winner.points);
          const lapLength = state.players.length - 1;
          const tieBroken = tiedOnPoints.length > 1;
          const stillTied = tieBroken && tiedOnPoints.every((p) => p.beaten === winner.beaten);
          return (
            <div className="rounded-lg border border-primary/40 bg-primary/5 px-5 py-6 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-1">
                {stillTied ? "Tied" : "Game Complete"}
              </p>
              <h2 className="font-clash text-3xl md:text-4xl font-bold leading-none mb-2">
                {stillTied
                  ? tiedOnPoints.map((p) => p.name).join(" & ")
                  : `${winner.name} wins`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {winner.points} gauntlet{winner.points === 1 ? "" : "s"} over 18 holes
              </p>
              {tieBroken && !stillTied && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tiebreaker: {winner.beaten}/{lapLength} on lap progress
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={undoLastHole}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Edit hole 18
              </Button>
            </div>
          );
        })()}

        {!gameOver && (<>
        {/* Score entry */}
        <div className="space-y-2">
          {state.players.map((p, i) => {
            const target = state.players[p.targetIndex];
            const current = holeEntry[i];
            const currentNum = Number(current);
            const setVal = (v: string) => {
              const next = [...holeEntry];
              next[i] = v;
              setHoleEntry(next);
            };
            const bump = (delta: number) => {
              const now = Date.now();
              if (now - lastBumpRef.current < 350) return;
              lastBumpRef.current = now;
              const base = Number.isFinite(currentNum) && current !== "" ? currentNum : 0;
              const v = Math.max(1, base + delta);
              setVal(String(v));
            };
            const quick = [3, 4, 5, 6];
            const hasScore = current !== "" && Number.isFinite(currentNum) && currentNum > 0;
            return (
              <div
                key={`entry-${p.name}-${String(i)}`}
                className={`rounded-lg border bg-card transition-colors ${hasScore ? "border-primary/40" : "border-border"}`}
              >
                {/* Player + target row */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-clash text-xl font-bold text-foreground leading-none truncate">
                      {p.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">{target.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Trophy className="w-3 h-3 text-primary" />
                    <span className="text-xs font-semibold text-primary tabular-nums">{p.points}</span>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-2 px-3 pb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 touch-manipulation select-none border-border"
                    onPointerDown={(e) => { e.preventDefault(); bump(-1); }}
                    aria-label="Decrease"
                  >
                    <Minus className="!w-5 !h-5" />
                  </Button>

                  <div className="flex-1 grid grid-cols-4 gap-1.5">
                    {quick.map((q) => {
                      const active = current === String(q);
                      return (
                        <Button
                          key={q}
                          type="button"
                          variant={active ? "default" : "outline"}
                          className={`h-11 text-base font-bold touch-manipulation select-none border-border transition-all ${active ? "ring-1 ring-primary scale-[0.97]" : "text-muted-foreground hover:text-foreground"}`}
                          onPointerDown={(e) => { e.preventDefault(); setVal(String(q)); }}
                          onDoubleClick={(e) => { e.preventDefault(); }}
                        >
                          {q}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 touch-manipulation select-none border-border"
                    onPointerDown={(e) => { e.preventDefault(); bump(1); }}
                    aria-label="Increase"
                  >
                    <Plus className="!w-5 !h-5" />
                  </Button>

                  <div className={`h-11 w-12 shrink-0 flex items-center justify-center rounded-md border font-clash text-xl font-bold tabular-nums transition-colors ${hasScore ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                    {hasScore ? current : "–"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit / back */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-12 px-3 text-muted-foreground hover:text-foreground gap-1.5"
            onClick={undoLastHole}
            disabled={state.holes.length === 0}
            aria-label="Go back a hole"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">
              {state.holes.length === 0 ? "Back" : `Hole ${String(state.holes.length)}`}
            </span>
          </Button>
          <Button className="flex-1 h-12 text-base font-semibold tracking-wide" onClick={submitHole}>
            Submit Hole {holeNumber}
          </Button>
        </div>
        </>)}

        {/* Leaderboard */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-clash text-base font-bold tracking-wide uppercase text-muted-foreground">
              {gameOver ? "Final Standings" : "Standings"}
            </h2>
          </div>
          <div className="divide-y divide-border">
            {leaderboard.map((p, i) => {
              const totalPlayers = state.players.length;
              const lapLength = totalPlayers - 1;
              const beaten = p.beaten;
              const pct = (beaten / lapLength) * 100;
              // Compute a "competition" rank that respects ties (T1 if tied at top)
              const rank =
                leaderboard.findIndex(
                  (x) => x.points === p.points && x.beaten === p.beaten,
                ) + 1;
              const tied =
                leaderboard.filter(
                  (x) => x.points === p.points && x.beaten === p.beaten,
                ).length > 1;
              return (
                <div key={p.idx} className="flex items-center gap-4 px-4 py-3">
                  <span className={`font-clash text-2xl font-bold w-8 leading-none tabular-nums ${i === 0 ? "text-primary" : "text-muted-foreground/40"}`}>
                    {tied ? "T" : ""}{rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 flex-1 max-w-[80px] rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${String(pct)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {beaten}/{lapLength} this lap
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-clash text-xl font-bold text-foreground leading-none">
                      {p.points}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">gauntlets</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scorecard */}
        {state.holes.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-clash text-base font-bold tracking-wide uppercase text-muted-foreground">
                Scorecard
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-0">
                    <TableHead className="sticky left-0 bg-card text-xs font-medium text-muted-foreground pl-4 w-24">
                      Player
                    </TableHead>
                    {state.holes.map((_, h) => (
                      <TableHead key={`hd-${String(h)}`} className="text-center text-xs text-muted-foreground w-10 px-1">
                        {h + 1}
                      </TableHead>
                    ))}
                    <TableHead className="text-center text-xs text-muted-foreground w-10 font-semibold">
                      Tot
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.players.map((p, i) => {
                    const total = state.holes.reduce(
                      (sum, h) => sum + (h[i] ?? 0),
                      0,
                    );
                    return (
                      <TableRow key={`row-${p.name}-${String(i)}`} className="hover:bg-transparent">
                        <TableCell className="font-medium text-sm sticky left-0 bg-card pl-4 py-2">
                          {p.name}
                        </TableCell>
                        {state.holes.map((h, hi) => (
                          <TableCell
                            key={`c-${String(i)}-${String(hi)}`}
                            className="text-center text-sm text-muted-foreground tabular-nums py-2 px-1"
                          >
                            {h[i]}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold tabular-nums py-2">
                          {total}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
