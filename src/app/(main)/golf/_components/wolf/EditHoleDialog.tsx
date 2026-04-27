"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { HoleEntry } from "./HoleEntry";
import type { WolfHole, WolfPlayer } from "../../_lib/wolf/types";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holeIndex: number | null;
    players: WolfPlayer[];
    initialHole: WolfHole | null;
    onSave: (holeIndex: number, hole: WolfHole) => void;
};

export function EditHoleDialog({
    open,
    onOpenChange,
    holeIndex,
    players,
    initialHole,
    onSave,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Edit Hole {holeIndex === null ? "" : holeIndex + 1}
                    </DialogTitle>
                    <DialogDescription>
                        Update Wolf&apos;s decision and scores. Standings recompute
                        automatically.
                    </DialogDescription>
                </DialogHeader>
                {open && holeIndex !== null && initialHole !== null && (
                    <HoleEntry
                        // remount per hole edit so internal state resets
                        key={`edit-${String(holeIndex)}`}
                        players={players}
                        holeNumber={holeIndex + 1}
                        initialScores={initialHole.scores}
                        initialDecision={initialHole.decision}
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
