"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { finalStandings } from "../../_lib/gauntlet/engine";
import type { Player } from "../../_lib/gauntlet/types";

type Props = {
    players: Player[];
    holesPlayed: number;
    onEditFinalHole?: () => void;
};

export function GameOverBanner({ players, holesPlayed, onEditFinalHole }: Props) {
    const { winner, coWinners, tieBroken } = finalStandings(players);
    const stillTied = coWinners.length > 1;

    return (
        <div
            className="rounded-lg border border-primary/40 bg-primary/5 px-5 py-6 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
            role="status"
            aria-live="polite"
        >
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-1">
                {stillTied ? "Tied" : "Game Complete"}
            </p>
            <h2 className="font-clash text-3xl md:text-4xl font-bold leading-none mb-2">
                {stillTied
                    ? coWinners.map((p) => p.name).join(" & ")
                    : `${winner.name} wins`}
            </h2>
            <p className="text-sm text-muted-foreground">
                {winner.points} gauntlet{winner.points === 1 ? "" : "s"} over{" "}
                {holesPlayed} hole{holesPlayed === 1 ? "" : "s"}
            </p>
            {tieBroken && !stillTied && (
                <p className="text-xs text-muted-foreground mt-2">
                    Tiebreaker: {winner.beaten}/{winner.lapLength} on lap progress
                </p>
            )}
            {onEditFinalHole && (
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={onEditFinalHole}
                >
                    <Pencil aria-hidden="true" className="w-3.5 h-3.5" /> Edit Final Hole
                </Button>
            )}
        </div>
    );
}
