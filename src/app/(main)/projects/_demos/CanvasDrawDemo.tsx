"use client";

import { useHistory } from "easy-history";
import { Undo2, Redo2, Trash2, Camera, RotateCcw } from "lucide-react";
import { useRef, useEffect, useCallback, useState } from "react";

type Point = { x: number; y: number };
type Stroke = Point[];

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

const DEG_TO_RAD = Math.PI / 180;
const FULL_CIRCLE_STEPS = 64;
const ARC_STEPS = 32;
const STROKE_WIDTH = 2.5;

const CANVAS_W = 800;
const CANVAS_H = 400;

// Smiley face geometry (coordinates relative to 800x400 canvas)
const FACE_CX = 400;
const FACE_CY = 200;
const FACE_R = 130;

const EYE_Y = 162;
const EYE_R = 18;
const EYE_STEPS = 24;
const LEFT_EYE_X = 355;
const RIGHT_EYE_X = 445;

const SMILE_CY = 210;
const SMILE_R = 85;
const SMILE_START_DEG = 28;
const SMILE_END_DEG = 152;

const SHINE_R = 9;
const SHINE_STEPS = 12;
const SHINE_START_DEG = 200;
const SHINE_END_DEG = 340;

function makeCircle(cx: number, cy: number, r: number, steps = FULL_CIRCLE_STEPS): Stroke {
    return Array.from({ length: steps + 1 }, (_, i) => {
        const t = (i / steps) * Math.PI * 2;
        return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
    });
}

function makeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number, steps = ARC_STEPS): Stroke {
    const start = startDeg * DEG_TO_RAD;
    const end = endDeg * DEG_TO_RAD;
    return Array.from({ length: steps + 1 }, (_, i) => {
        const t = start + (i / steps) * (end - start);
        return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
    });
}

const INITIAL_STROKES: Stroke[] = [
    makeCircle(FACE_CX, FACE_CY, FACE_R),
    makeCircle(LEFT_EYE_X, EYE_Y, EYE_R, EYE_STEPS),
    makeCircle(RIGHT_EYE_X, EYE_Y, EYE_R, EYE_STEPS),
    makeArc(FACE_CX, SMILE_CY, SMILE_R, SMILE_START_DEG, SMILE_END_DEG),
    makeArc(LEFT_EYE_X, EYE_Y, SHINE_R, SHINE_START_DEG, SHINE_END_DEG, SHINE_STEPS),
    makeArc(RIGHT_EYE_X, EYE_Y, SHINE_R, SHINE_START_DEG, SHINE_END_DEG, SHINE_STEPS),
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CanvasDrawDemo() {
    const { state, set, undo, redo, canUndo, canRedo, takeSnapshot, restoreSnapshot } = useHistory({
        strokes: INITIAL_STROKES,
    });

    type Snapshot = ReturnType<typeof takeSnapshot>;
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

    const handleSave = () => setSnapshot(takeSnapshot());
    const handleRestore = () => { if (snapshot) restoreSnapshot(snapshot); };

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const colorRef = useRef<HTMLDivElement>(null);
    const currentStrokeRef = useRef<Stroke>([]);
    const isDrawingRef = useRef(false);

    const getStrokeColor = useCallback(
        () => (colorRef.current ? getComputedStyle(colorRef.current).color : "#888"),
        []
    );

    const redraw = useCallback(
        (strokes: Stroke[]) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = getStrokeColor();
            ctx.lineWidth = STROKE_WIDTH;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (const stroke of strokes) {
                if (stroke.length < 2) continue;
                ctx.beginPath();
                ctx.moveTo(stroke[0].x, stroke[0].y);
                for (let i = 1; i < stroke.length; i++) {
                    ctx.lineTo(stroke[i].x, stroke[i].y);
                }
                ctx.stroke();
            }
        },
        [getStrokeColor]
    );

    useEffect(() => {
        redraw(state.strokes);
    }, [state.strokes, redraw]);

    const getPos = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            if ("touches" in e) {
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY,
                };
            }
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        },
        []
    );

    const handleStart = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
            isDrawingRef.current = true;
            currentStrokeRef.current = [getPos(e)];
        },
        [getPos]
    );

    const handleMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
            if (!isDrawingRef.current) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const pos = getPos(e);
            const stroke = currentStrokeRef.current;
            stroke.push(pos);
            const prev = stroke.at(-2);
            if (prev) {
                ctx.strokeStyle = getStrokeColor();
                ctx.lineWidth = STROKE_WIDTH;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
        },
        [getPos, getStrokeColor]
    );

    const handleEnd = useCallback(() => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const stroke = currentStrokeRef.current;
        if (stroke.length > 1) {
            set({ strokes: [...state.strokes, stroke] });
        }
        currentStrokeRef.current = [];
    }, [set, state.strokes]);

    const snapshotStrokeCount = snapshot
        ? (snapshot as { present: { strokes: Stroke[] } }).present.strokes.length
        : 0;

    return (
        <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-6 space-y-4">
            <div ref={colorRef} className="text-foreground hidden" aria-hidden="true" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Live Demo — Canvas Drawing
            </p>
            <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                className="w-full rounded-lg border border-border/60 bg-background touch-none cursor-crosshair"
            />
            <div className="flex flex-wrap justify-center gap-2">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Undo2 className="w-3.5 h-3.5" /> Undo
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Redo2 className="w-3.5 h-3.5" /> Redo
                </button>
                <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors"
                >
                    <Camera className="w-3.5 h-3.5" /> Save snapshot
                </button>
                <button
                    onClick={handleRestore}
                    disabled={!snapshot}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore snapshot
                </button>
                <button
                    onClick={() => set({ strokes: INITIAL_STROKES })}
                    disabled={state.strokes === INITIAL_STROKES}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Reset
                </button>
            </div>
            {snapshot && (
                <p className="text-center text-xs text-muted-foreground">
                    Snapshot saved at{" "}
                    <span className="text-primary font-medium">
                        {snapshotStrokeCount} {snapshotStrokeCount === 1 ? "stroke" : "strokes"}
                    </span>
                </p>
            )}
        </div>
    );
}
