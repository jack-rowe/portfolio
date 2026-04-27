"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { HoleEntry } from "./HoleEntry";
import type { LcrHole, LcrPlayer } from "../../_lib/lcr/types";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holeIndex: number | null;
    players: LcrPlayer[];
    initialHole: LcrHole | null;
    onSave: (holeIndex: number, hole: LcrHole) => void;
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
                        Update scores. Standings recompute automatically.
                    </DialogDescription>
                </DialogHeader>
                {open && holeIndex !== null && initialHole !== null && (
                    <HoleEntry
                        key={`edit-${String(holeIndex)}`}
                        players={players}
                        holeNumber={holeIndex + 1}
                        initialHole={initialHole}
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
