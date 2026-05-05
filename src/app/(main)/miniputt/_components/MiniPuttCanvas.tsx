"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import { CANVAS_W, CANVAS_H, COURSE, createWorld } from "../_lib";
import type { Ball } from "../_lib/ball";
import { usePutting } from "../_hooks/use-putting";
import { useGame } from "../_hooks/use-game";

export default function MiniPuttCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const ballRef = useRef<Ball | null>(null);

    const game = useGame();
    const {
        state,
        currentHole,
        totalStrokes,
        relativeToPar,
        totalHoles,
        addStroke,
        completeHole,
        nextHole,
        reset,
    } = game;

    // (Re)build the world whenever the active hole changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return () => { };

        const { cleanup, render, ball } = createWorld(canvas, currentHole, {
            onSink: () => completeHole(),
            onWaterHit: () => addStroke(), // 1-stroke penalty
        });
        renderRef.current = render;
        ballRef.current = ball;

        return () => {
            cleanup();
            renderRef.current = null;
            ballRef.current = null;
        };
    }, [currentHole, completeHole, addStroke]);

    usePutting(canvasRef, renderRef, ballRef, {
        enabled: state.status === "playing",
        onShoot: addStroke,
        resetKey: state.holeIndex,
    });

    const par = currentHole.par;
    const showHoleComplete = state.status === "complete";
    const showFinished = state.status === "finished";

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {/* HUD */}
            <div className="flex items-center justify-between w-full max-w-[600px] text-white gap-2">
                <div className="min-w-0">
                    <div className="text-xs uppercase tracking-widest text-white/60">
                        Hole {currentHole.number} / {totalHoles}
                    </div>
                    <div className="text-base font-semibold truncate">{currentHole.name}</div>
                </div>
                <div className="flex gap-4 text-sm shrink-0">
                    <Stat label="Par" value={par} />
                    <Stat label="Strokes" value={state.strokes} />
                    <Stat
                        label="Total"
                        value={`${totalStrokes} (${formatRel(relativeToPar)})`}
                    />
                </div>
            </div>

            {/* Canvas + overlays */}
            <div className="relative w-full max-w-[600px]">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="rounded-xl border-2 border-amber-900/60 shadow-2xl cursor-crosshair block w-full h-auto"
                    style={{ touchAction: "none" }}
                />

                {showHoleComplete && (
                    <Overlay>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {scoreLabel(state.strokes, par)}
                        </h2>
                        <p className="text-white/80 mb-4">
                            Hole {currentHole.number} in {state.strokes}{" "}
                            {state.strokes === 1 ? "stroke" : "strokes"}
                        </p>
                        <button
                            onClick={nextHole}
                            className="px-6 py-2 bg-white text-emerald-900 font-semibold rounded-lg hover:bg-amber-100 transition"
                        >
                            {state.holeIndex + 1 >= totalHoles ? "View Card" : "Next Hole"}
                        </button>
                    </Overlay>
                )}

                {showFinished && (
                    <Overlay>
                        <h2 className="text-3xl font-bold text-white mb-3">Round Complete</h2>
                        <Scorecard scores={state.scores} />
                        <p className="text-white text-lg mt-3">
                            Final: {totalStrokes} ({formatRel(relativeToPar)})
                        </p>
                        <button
                            onClick={reset}
                            className="mt-4 px-6 py-2 bg-white text-emerald-900 font-semibold rounded-lg hover:bg-amber-100 transition"
                        >
                            Play Again
                        </button>
                    </Overlay>
                )}
            </div>

            {/* Mini-scorecard strip */}
            <div className="w-full max-w-[600px] px-0">
                <Scorecard scores={state.scores} compact />
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-white/60">
                {label}
            </div>
            <div className="font-semibold tabular-nums">{value}</div>
        </div>
    );
}

function Overlay({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 rounded-xl backdrop-blur-sm">
            {children}
        </div>
    );
}

function cellColor(diff: number | null): string {
    if (diff === null) return "bg-white/10";
    if (diff <= EAGLE_OR_BETTER) return "bg-yellow-500/80";
    if (diff === -1) return "bg-emerald-500/80";
    if (diff === 0) return "bg-white/20";
    if (diff === 1) return "bg-orange-500/70";
    return "bg-red-600/70";
}

function Scorecard({
    scores,
    compact = false,
}: {
    scores: (number | null)[];
    compact?: boolean;
}) {
    return (
        <div
            className={`grid grid-cols-9 gap-1 text-white text-xs ${compact ? "" : "text-sm"
                }`}
        >
            {COURSE.map((h: typeof COURSE[number], i: number) => {
                const s = scores[i];
                const diff = s === null || s === undefined ? null : s - h.par;
                return (
                    <div
                        key={h.number}
                        className={`flex flex-col items-center rounded ${cellColor(diff)} py-1`}
                    >
                        <div className="text-[10px] text-white/70">H{h.number}</div>
                        <div className="font-bold tabular-nums">{s ?? "–"}</div>
                    </div>
                );
            })}
        </div>
    );
}

function formatRel(n: number): string {
    if (n === 0) return "E";
    return n > 0 ? `+${n}` : `${n}`;
}

const EAGLE_OR_BETTER = -2;
const DOUBLE_BOGEY = 2;

function scoreLabel(strokes: number, par: number): string {
    const diff = strokes - par;
    if (strokes === 1) return "Hole In One!";
    if (diff <= EAGLE_OR_BETTER) return "Eagle!";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === DOUBLE_BOGEY) return "Double Bogey";
    return `+${diff}`;
}

