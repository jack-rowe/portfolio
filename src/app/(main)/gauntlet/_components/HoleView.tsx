"use client";

import { ArrowRight, Pencil, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lapProgress } from "../_lib/engine";
import type { HoleScores, Player } from "../_lib/types";

type Props = {
    /** Player state ENTERING this hole (i.e. after holes 0..holeIndex-1). */
    playersEntering: Player[];
    /** Player state AFTER this hole, for showing post-hole points/targets. */
    playersAfter: Player[];
    holeNumber: number;
    scores: HoleScores;
    onEdit: () => void;
};

export function HoleView({
    playersEntering,
    playersAfter,
    holeNumber,
    scores,
    onEdit,
}: Props) {
    const total = playersEntering.length;

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {playersEntering.map((p, i) => {
                    const target = playersEntering[p.targetIndex];
                    const after = playersAfter[i];
                    const beat = scores[i] < scores[p.targetIndex];
                    const lapBefore = lapProgress(p, i, total);
                    const lapAfter = lapProgress(after, i, total);
                    const wonPoint = after.points > p.points;
                    return (
                        <div
                            key={p.id}
                            className={`rounded-lg border bg-card px-4 py-3 transition-colors ${beat ? "border-primary/40" : "border-border"
                                }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-clash text-xl font-bold text-foreground leading-none truncate">
                                            {p.name}
                                        </span>
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                                        />
                                        <span className="text-sm text-muted-foreground truncate">
                                            chased {target.name}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {beat ? (
                                            wonPoint ? (
                                                <span className="text-primary font-medium">
                                                    Lap complete · +1 gauntlet
                                                </span>
                                            ) : (
                                                <span className="text-primary font-medium">
                                                    Beat target · advanced ({lapAfter.beaten}/
                                                    {lapAfter.lapLength})
                                                </span>
                                            )
                                        ) : (
                                            <span>
                                                Held position ({lapBefore.beaten}/{lapBefore.lapLength})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <Trophy
                                            aria-hidden="true"
                                            className="w-3 h-3 text-primary"
                                        />
                                        <span className="text-xs font-semibold text-primary tabular-nums">
                                            {after.points}
                                        </span>
                                    </div>
                                    <div
                                        className={`h-12 w-12 flex items-center justify-center rounded-md border font-clash text-2xl font-bold tabular-nums ${beat
                                            ? "border-primary text-primary bg-primary/5"
                                            : "border-border text-foreground"
                                            }`}
                                        aria-label={`${p.name} scored ${String(scores[i])}`}
                                    >
                                        {scores[i]}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Button
                variant="outline"
                className="w-full h-12 gap-2"
                onClick={onEdit}
                aria-label={`Edit hole ${String(holeNumber)} scores`}
            >
                <Pencil aria-hidden="true" className="w-4 h-4" />
                <span className="text-sm font-semibold">
                    Edit hole {holeNumber}
                </span>
            </Button>
        </div>
    );
}
