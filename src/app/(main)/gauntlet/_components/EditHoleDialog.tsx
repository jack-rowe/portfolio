"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HoleScores, Player } from "../_lib/types";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holeIndex: number | null;
    players: Player[];
    initialScores: HoleScores | null;
    onSave: (holeIndex: number, scores: HoleScores) => void;
};

export function EditHoleDialog({
    open,
    onOpenChange,
    holeIndex,
    players,
    initialScores,
    onSave,
}: Props) {
    const [values, setValues] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        setValues(
            players.map((_, i) => {
                const v = initialScores?.[i];
                return v === undefined || v === null ? "" : String(v);
            }),
        );
    }, [open, initialScores, players]);

    const canSave = values.every((s) => {
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) && n > 0;
    });

    const save = () => {
        if (holeIndex === null || !canSave) return;
        onSave(
            holeIndex,
            values.map((s) => Number.parseInt(s, 10)),
        );
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Edit Hole {holeIndex === null ? "" : holeIndex + 1}
                    </DialogTitle>
                    <DialogDescription>
                        Update the scores for this hole. Standings will recompute
                        automatically.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    {players.map((p, i) => {
                        const id = `edit-${p.id}`;
                        return (
                            <div key={p.id} className="flex items-center gap-3">
                                <Label htmlFor={id} className="w-24 shrink-0 truncate">
                                    {p.name}
                                </Label>
                                <Input
                                    id={id}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="off"
                                    className="h-11 text-base font-clash tabular-nums"
                                    value={values[i] ?? ""}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/[^\d]/g, "");
                                        setValues((prev) => {
                                            const next = [...prev];
                                            next[i] = digits;
                                            return next;
                                        });
                                    }}
                                    onFocus={(e) => {
                                        e.target.select();
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={save} disabled={!canSave}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
