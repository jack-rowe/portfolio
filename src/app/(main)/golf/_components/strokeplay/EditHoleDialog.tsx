"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { HoleEntry } from "./HoleEntry";
import type { HandicapConfig } from "../../_lib/handicap";
import type {
    StrokeplayHole,
    StrokeplayPlayer,
} from "../../_lib/strokeplay/types";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holeIndex: number | null;
    players: StrokeplayPlayer[];
    initialHole: StrokeplayHole | null;
    onSave: (holeIndex: number, hole: StrokeplayHole) => void;
    handicap?: HandicapConfig;
};

export function EditHoleDialog({
    open,
    onOpenChange,
    holeIndex,
    players,
    initialHole,
    onSave,
    handicap,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Edit Hole {holeIndex === null ? "" : holeIndex + 1}
                    </DialogTitle>
                    <DialogDescription>
                        Update gross strokes. Totals recompute automatically.
                    </DialogDescription>
                </DialogHeader>
                {open && holeIndex !== null && initialHole !== null && (
                    <HoleEntry
                        key={`edit-${String(holeIndex)}`}
                        players={players}
                        holeNumber={holeIndex + 1}
                        initialScores={initialHole.scores}
                        handicap={handicap}
                        onSubmit={(hole) => {
                            onSave(holeIndex, hole);
                            onOpenChange(false);
                        }}
                        inline
                        submitLabel="Save"
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
