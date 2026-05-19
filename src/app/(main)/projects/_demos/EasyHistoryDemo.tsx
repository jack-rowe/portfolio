"use client";

import { useHistory } from "easy-history";
import { Undo2, Redo2, Camera, RotateCcw } from "lucide-react";
import { useState } from "react";

export function EasyHistoryDemo() {
    const { state, set, undo, redo, canUndo, canRedo, takeSnapshot, restoreSnapshot } =
        useHistory({ count: 8 });

    type Snapshot = ReturnType<typeof takeSnapshot>;
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

    const handleSave = () => setSnapshot(takeSnapshot());
    const handleRestore = () => { if (snapshot) restoreSnapshot(snapshot); };

    return (
        <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-6 space-y-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Live Demo - Counter
            </p>

            {/* Counter display */}
            <div className="flex items-center justify-center gap-6">
                <button
                    onClick={() => set({ count: state.count - 1 })}
                    className="w-10 h-10 rounded-lg border border-border text-foreground text-xl font-bold hover:bg-card transition-colors"
                    aria-label="Decrement"
                >
                    −
                </button>
                <span className="font-clash text-6xl font-bold text-foreground w-24 text-center tabular-nums">
                    {state.count}
                </span>
                <button
                    onClick={() => set({ count: state.count + 1 })}
                    className="w-10 h-10 rounded-lg border border-border text-foreground text-xl font-bold hover:bg-card transition-colors"
                    aria-label="Increment"
                >
                    +
                </button>
            </div>

            {/* Controls */}
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
            </div>

            {snapshot && (
                <p className="text-center text-xs text-muted-foreground">
                    Snapshot saved at <span className="text-primary font-medium">{(snapshot as { present: { count: number } }).present.count}</span>
                </p>
            )}
        </div>
    );
}
