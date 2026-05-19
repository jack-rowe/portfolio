"use client";

import { useHistory } from "easy-history";
import { Undo2, Redo2, Camera, RotateCcw, Plus, Trash2, CheckCheck, X } from "lucide-react";
import { useState } from "react";

type Task = { id: string; text: string; done: boolean };

type TaskState = { tasks: Task[] };

function nextId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function TaskListDemo() {
    const { state, set, undo, redo, canUndo, canRedo, batch, takeSnapshot, restoreSnapshot } =
        useHistory<TaskState>({
            tasks: [
                { id: "seed-1", text: "Design the API", done: true },
                { id: "seed-2", text: "Write unit tests", done: false },
                { id: "seed-3", text: "Publish to npm", done: false },
            ],
        });

    type Snapshot = ReturnType<typeof takeSnapshot>;
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [input, setInput] = useState("");

    const addTask = () => {
        const text = input.trim();
        if (!text) return;
        set({ tasks: [...state.tasks, { id: nextId(), text, done: false }] });
        setInput("");
    };

    const toggleTask = (id: string) => {
        set({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
    };

    const deleteTask = (id: string) => {
        set({ tasks: state.tasks.filter((t) => t.id !== id) });
    };

    // batch() takes (currentState => newState) — the entire bulk update is one history entry
    const completeAll = () => {
        batch((current) => ({ tasks: current.tasks.map((t) => ({ ...t, done: true })) }));
    };

    const clearDone = () => {
        batch((current) => ({ tasks: current.tasks.filter((t) => !t.done) }));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") addTask();
    };

    const doneCount = state.tasks.filter((t) => t.done).length;
    const allDone = doneCount === state.tasks.length && state.tasks.length > 0;
    const noneDone = doneCount === 0;

    const snapshotTaskCount =
        snapshot !== null
            ? (snapshot as { present: TaskState }).present.tasks.length
            : null;

    return (
        <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                    Live demo — task list
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                    {doneCount} / {state.tasks.length} done
                </p>
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="New task…"
                    className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                    onClick={addTask}
                    disabled={!input.trim()}
                    aria-label="Add task"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Task list */}
            <ul className="space-y-1.5 min-h-[5rem]">
                {state.tasks.length === 0 && (
                    <li className="text-center text-sm text-muted-foreground/50 py-5">
                        No tasks — add one above or undo
                    </li>
                )}
                {state.tasks.map((task) => (
                    <li
                        key={task.id}
                        className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/20 px-3 py-2"
                    >
                        <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => toggleTask(task.id)}
                            className="accent-primary w-3.5 h-3.5 cursor-pointer shrink-0"
                            aria-label={`Toggle: ${task.text}`}
                        />
                        <span
                            className={[
                                "flex-1 text-sm text-foreground truncate transition-opacity",
                                task.done ? "line-through opacity-40" : "",
                            ].join(" ")}
                        >
                            {task.text}
                        </span>
                        <button
                            onClick={() => deleteTask(task.id)}
                            aria-label={`Delete: ${task.text}`}
                            className="text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </li>
                ))}
            </ul>

            {/* Batch actions */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={completeAll}
                    disabled={allDone || state.tasks.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <CheckCheck className="w-3.5 h-3.5" /> Complete all
                </button>
                <button
                    onClick={clearDone}
                    disabled={noneDone}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Clear done
                </button>
            </div>

            {/* Undo / redo / snapshot */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
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
                    onClick={() => setSnapshot(takeSnapshot())}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors"
                >
                    <Camera className="w-3.5 h-3.5" /> Save checkpoint
                </button>
                <button
                    onClick={() => {
                        if (snapshot) restoreSnapshot(snapshot);
                    }}
                    disabled={!snapshot}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore checkpoint
                </button>
            </div>

            {snapshotTaskCount !== null && (
                <p className="text-xs text-muted-foreground">
                    Checkpoint saved with{" "}
                    <span className="text-primary font-medium">{snapshotTaskCount}</span> task
                    {snapshotTaskCount === 1 ? "" : "s"}
                </p>
            )}
        </div>
    );
}
