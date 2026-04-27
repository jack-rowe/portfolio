"use client";

import { Pencil, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { holeOutcome } from "../../_lib/wolf/engine";
import type { WolfHole, WolfPlayer } from "../../_lib/wolf/types";

type Props = {
    players: WolfPlayer[];
    hole: WolfHole;
    holeNumber: number;
    onEdit: () => void;
};

function decisionLabel(hole: WolfHole, partnerName?: string): string {
    if (hole.decision.kind === "partner") {
        return partnerName ? `Partner: ${partnerName}` : "Partner";
    }
    return hole.decision.blind ? "Blind Wolf" : "Lone Wolf";
}

export function HoleView({ players, hole, holeNumber, onEdit }: Props) {
    const outcome = holeOutcome(hole, holeNumber - 1, players.length);
    const wolf = players[outcome.wolfIndex];
    const partnerName =
        hole.decision.kind === "partner"
            ? players[hole.decision.partnerIndex]?.name
            : undefined;

    const resultText =
        outcome.result === "tie"
            ? "Tied — no points"
            : outcome.result === "wolf"
                ? "Wolf team wins"
                : "Field wins";

    return (
        <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Wolf
                        </p>
                        <p className="font-clash text-xl font-bold truncate">
                            {wolf.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {decisionLabel(hole, partnerName)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p
                            className={cn(
                                "text-xs uppercase tracking-[0.2em] font-medium",
                                outcome.result === "tie"
                                    ? "text-muted-foreground"
                                    : "text-primary",
                            )}
                        >
                            {resultText}
                        </p>
                        <p className="font-clash text-xs text-muted-foreground tabular-nums mt-0.5">
                            {outcome.wolfBest} vs {outcome.oppBest}
                        </p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    {players.map((p, i) => {
                        const onWolfTeam = outcome.wolfTeam.includes(i);
                        const award = outcome.award[i];
                        return (
                            <div
                                key={p.id}
                                className={cn(
                                    "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5",
                                    onWolfTeam
                                        ? "border-primary/40 bg-primary/5"
                                        : "border-border",
                                )}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-semibold truncate">
                                        {p.name}
                                    </span>
                                    {i === outcome.wolfIndex && (
                                        <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-primary">
                                            Wolf
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-clash text-base font-bold tabular-nums">
                                        {hole.scores[i]}
                                    </span>
                                    {award > 0 ? (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-primary tabular-nums">
                                            <Trophy
                                                aria-hidden="true"
                                                className="w-3 h-3"
                                            />
                                            +{award}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            —
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={onEdit}
                >
                    <Pencil aria-hidden="true" className="w-3.5 h-3.5" /> Edit hole
                </Button>
            </div>
        </div>
    );
}
