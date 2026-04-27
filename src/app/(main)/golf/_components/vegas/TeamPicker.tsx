"use client";

import { cn } from "@/lib/utils";
import type { VegasPlayer, VegasTeams } from "../../_lib/vegas/types";

type Props = {
    players: VegasPlayer[];
    teams: VegasTeams;
};

function teamLabelFor(teams: VegasTeams): string {
    const a = teams.teamA.map((i) => String(i + 1)).join("+");
    const b = teams.teamB.map((i) => String(i + 1)).join("+");
    return `${a} vs ${b}`;
}

export function TeamDisplay({ players, teams }: Props) {
    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Teams · {teamLabelFor(teams)}
            </p>
            <div className="grid grid-cols-2 gap-2">
                <TeamColumn
                    label="A"
                    names={teams.teamA.map((i) => players[i].name)}
                    primary
                />
                <TeamColumn
                    label="B"
                    names={teams.teamB.map((i) => players[i].name)}
                />
            </div>
        </div>
    );
}

function TeamColumn({
    label,
    names,
    primary,
}: {
    label: string;
    names: string[];
    primary?: boolean;
}) {
    return (
        <div
            className={cn(
                "rounded-md border px-3 py-2",
                primary ? "border-primary/40" : "border-border",
            )}
        >
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Team {label}
            </p>
            <ul className="font-clash text-base font-bold leading-tight space-y-0.5 break-words">
                {names.map((name) => (
                    <li key={name}>{name}</li>
                ))}
            </ul>
        </div>
    );
}
