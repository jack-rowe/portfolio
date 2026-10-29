"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DailyData } from "../_hooks/use-daily-data";
import { finishedWeeks, lastWeekWinners, liveResults } from "../_lib/stats";
import { CalendarTab } from "./CalendarTab";
import { ChampionsContext } from "./champions";
import { StandingsTab } from "./StandingsTab";
import { TodayTab } from "./TodayTab";

// The chart library only loads when someone opens Trends.
const TrendsTab = dynamic(() => import("./TrendsTab").then((m) => m.TrendsTab), {
    ssr: false,
    loading: () => <p className="py-8 text-center text-muted-foreground">Loading chart…</p>,
});

type Props = DailyData & { today: string | null };

export function Board({ players, games, results, loading, error, today }: Props) {
    if (error) {
        return (
            <p role="alert" className="py-8 text-center text-destructive">
                {error}
            </p>
        );
    }
    if (loading || !today) return <p className="py-8 text-center text-muted-foreground">Loading scores…</p>;

    // Games removed from the board keep their results in Firestore, but they don't show here.
    const shown = liveResults(games, results);
    const weeks = finishedWeeks(games, shown, today);
    const props = { players, games, results: shown, today };

    return (
        <ChampionsContext.Provider value={new Set(lastWeekWinners(weeks, today))}>
            <Tabs defaultValue="today" className="flex flex-col gap-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="standings">Standings</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>
                <TabsContent value="today" className="mt-0">
                    <TodayTab {...props} />
                </TabsContent>
                <TabsContent value="standings" className="mt-0">
                    <StandingsTab {...props} weeks={weeks} />
                </TabsContent>
                <TabsContent value="calendar" className="mt-0">
                    <CalendarTab {...props} weeks={weeks} />
                </TabsContent>
                <TabsContent value="trends" className="mt-0">
                    <TrendsTab {...props} />
                </TabsContent>
            </Tabs>
        </ChampionsContext.Provider>
    );
}
