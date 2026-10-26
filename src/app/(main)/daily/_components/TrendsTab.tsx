"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, type TooltipProps } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Game, Player, Result } from "~firebase/types";
import { formatDay, formatShortDay } from "../_lib/dates";
import { formatAverage } from "../_lib/scoring";
import { trendLowerIsBetter, trendSeries } from "../_lib/stats";

const DAYS = 30;
const WINDOW = 7;

// The site's chart tokens are all one green, so players are told apart by dash
// pattern and labels rather than hue. Assigned by join order so they never shift.
const DASHES = ["", "6 4", "2 3", "10 3 2 3", "1 5", "14 4"];
const DIRECT_LABEL_LIMIT = 4;

type Props = {
    players: Player[];
    games: Game[];
    results: Result[];
    today: string;
};

function Swatch({ dash, active }: { dash: string; active: boolean }) {
    return (
        <svg aria-hidden width="24" height="8" className="shrink-0">
            <line
                x1="0"
                y1="4"
                x2="24"
                y2="4"
                strokeWidth="2"
                strokeDasharray={dash}
                className={active ? "stroke-primary" : "stroke-foreground"}
            />
        </svg>
    );
}

export function TrendsTab({ players, games, results, today }: Props) {
    const [gameSlug, setGameSlug] = useState<string | null>(null);
    const [focus, setFocus] = useState<string | null>(null);

    // Default to the game with the most recent result.
    const game = games.find((g) => g.slug === gameSlug) ?? games.find((g) => g.slug === results[0]?.game) ?? games[0];
    if (!game) return <p className="py-8 text-center text-muted-foreground">Add a game to see trends.</p>;

    const data = trendSeries(game, players, results, today, DAYS, WINDOW);
    const active = players.filter((p) => data.some((d) => d[p.slug] !== null));
    const dashOf = new Map(players.map((p, i) => [p.slug, DASHES[i % DASHES.length]]));
    const format = (v: number) => formatAverage(game, v);
    const reversed = trendLowerIsBetter(game);
    const lastIndex = new Map(
        active.map((p) => [p.slug, data.findLastIndex((d) => d[p.slug] !== null)]),
    );
    const config: ChartConfig = Object.fromEntries(active.map((p) => [p.slug, { label: p.name }]));

    const strokeFor = (slug: string) =>
        focus === slug ? "hsl(var(--primary))" : "hsl(var(--foreground))";
    const opacityFor = (slug: string) => (focus === null ? 0.8 : focus === slug ? 1 : 0.2);

    return (
        <div className="flex flex-col gap-4">
            <Select
                value={game.slug}
                onValueChange={(v) => {
                    setGameSlug(v);
                }}
            >
                <SelectTrigger className="w-44" aria-label="Game">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {games.map((g) => (
                        <SelectItem key={g.slug} value={g.slug}>
                            {g.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {active.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                    No {game.name} scores in the last {DAYS} days.
                </p>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground">
                        {WINDOW}-day rolling {game.type === "solved" ? "solve rate" : "average"} over the last{" "}
                        {DAYS} days. Better scores are higher.
                    </p>

                    {/* Legend doubles as a highlight toggle and a text readout of the latest values. */}
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Highlight a player">
                        {active.map((p) => {
                            const last = data[lastIndex.get(p.slug) ?? -1]?.[p.slug];
                            const on = focus === p.slug;
                            return (
                                <button
                                    key={p.slug}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => {
                                        setFocus(on ? null : p.slug);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 rounded-md border px-2 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                        on ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                                    )}
                                >
                                    <Swatch dash={dashOf.get(p.slug) ?? ""} active={on} />
                                    <span className="font-medium">{p.name}</span>
                                    {typeof last === "number" && (
                                        <span className="tabular-nums text-muted-foreground">{format(last)}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <ChartContainer config={config} className="aspect-auto h-72 w-full">
                        <LineChart data={data} margin={{ top: 8, right: active.length <= DIRECT_LABEL_LIMIT ? 64 : 16, bottom: 0, left: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(d: string) => formatShortDay(d)}
                            />
                            <YAxis
                                reversed={reversed}
                                tickLine={false}
                                axisLine={false}
                                width={44}
                                domain={game.type === "solved" ? [0, 1] : ["auto", "auto"]}
                                tickFormatter={(v: number) => format(v)}
                            />
                            <ChartTooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                content={<TrendTooltip players={active} format={format} game={game} />}
                            />
                            {active.map((p) => (
                                <Line
                                    key={p.slug}
                                    dataKey={p.slug}
                                    name={p.name}
                                    type="monotone"
                                    stroke={strokeFor(p.slug)}
                                    strokeOpacity={opacityFor(p.slug)}
                                    strokeWidth={focus === p.slug ? 3 : 2}
                                    strokeDasharray={dashOf.get(p.slug)}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                                    isAnimationActive={false}
                                    label={
                                        active.length <= DIRECT_LABEL_LIMIT
                                            ? (props: { x?: number; y?: number; index?: number }) =>
                                                  props.index === lastIndex.get(p.slug) ? (
                                                      <text
                                                          key={p.slug}
                                                          x={(props.x ?? 0) + 6}
                                                          y={(props.y ?? 0) + 4}
                                                          className="fill-foreground text-xs"
                                                          fillOpacity={opacityFor(p.slug) < 1 && focus ? 0.4 : 1}
                                                      >
                                                          {p.name}
                                                      </text>
                                                  ) : (
                                                      <g key={`${p.slug}-${String(props.index)}`} />
                                                  )
                                            : false
                                    }
                                />
                            ))}
                        </LineChart>
                    </ChartContainer>
                </>
            )}
        </div>
    );
}

type TooltipBody = TooltipProps<number, string> & {
    players: Player[];
    game: Game;
    format: (v: number) => string;
};

function TrendTooltip({ active, payload, label, players, game, format }: TooltipBody) {
    if (!active || !payload?.length) return null;
    const reversed = trendLowerIsBetter(game);
    const rows = payload
        .filter((item) => typeof item.value === "number")
        .sort((a, b) => (reversed ? (a.value ?? 0) - (b.value ?? 0) : (b.value ?? 0) - (a.value ?? 0)));

    return (
        <div className="grid min-w-36 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
            <p className="font-medium">{typeof label === "string" ? formatDay(label) : null}</p>
            {rows.map((item) => {
                const player = players.find((p) => p.slug === item.dataKey);
                return (
                    <div key={String(item.dataKey)} className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{player?.name ?? item.name}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                            {format(item.value ?? 0)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
