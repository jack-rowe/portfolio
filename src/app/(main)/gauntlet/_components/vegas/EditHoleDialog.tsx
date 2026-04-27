"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { HoleEntry } from "./HoleEntry";
import type {
    VegasHole,
    VegasPlayer,
    VegasTeams,
} from "../../_lib/vegas/types";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holeIndex: number | null;
    players: VegasPlayer[];
    teams: VegasTeams;
    initialHole: VegasHole | null;
    onSave: (holeIndex: number, hole: VegasHole) => void;
};

export function EditHoleDialog({
    open,
    onOpenChange,
    holeIndex,
    players,
    teams,
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
                        teams={teams}
                        holeNumber={holeIndex + 1}
                        initialScores={initialHole.scores}
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
