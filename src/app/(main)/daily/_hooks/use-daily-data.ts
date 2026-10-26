"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { watchGames, watchPlayers, watchResults } from "~firebase/scores";
import type { Game, Player, Result } from "~firebase/types";
import { localToday } from "../_lib/dates";

export type DailyData = {
    players: Player[];
    games: Game[];
    results: Result[];
    /** True until all three collections have loaded once. */
    loading: boolean;
    error: string | null;
};

/** Live players, games and results from Firestore. */
export function useDailyData(): DailyData {
    const [players, setPlayers] = useState<Player[] | null>(null);
    const [games, setGames] = useState<Game[] | null>(null);
    const [results, setResults] = useState<Result[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubs = [
            watchPlayers(setPlayers, setError),
            watchGames(setGames, setError),
            watchResults(setResults, setError),
        ];
        return () => {
            for (const unsub of unsubs) unsub();
        };
    }, []);

    return {
        players: players ?? [],
        games: games ?? [],
        results: results ?? [],
        loading: (players === null || games === null || results === null) && error === null,
        error,
    };
}

function subscribeToClock(onChange: () => void): () => void {
    // Re-check once a minute and whenever the tab comes back, so the board rolls over at midnight.
    const timer = setInterval(onChange, 60_000);
    document.addEventListener("visibilitychange", onChange);
    return () => {
        clearInterval(timer);
        document.removeEventListener("visibilitychange", onChange);
    };
}

/**
 * Today's date on this device, or null during server rendering
 * (the server's time zone isn't the player's).
 */
export function useToday(): string | null {
    return useSyncExternalStore(subscribeToClock, localToday, () => null);
}
