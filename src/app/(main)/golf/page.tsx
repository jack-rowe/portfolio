"use client";

import { useCallback, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { GauntletShell } from "./_components/gauntlet/GauntletShell";
import { HollywoodShell } from "./_components/hollywood/HollywoodShell";
import { LcrShell } from "./_components/lcr/LcrShell";
import { MatchplayShell } from "./_components/matchplay/MatchplayShell";
import { Setup } from "./_components/Setup";
import { VegasShell } from "./_components/vegas/VegasShell";
import { WolfShell } from "./_components/wolf/WolfShell";
import { useGauntlet } from "./_hooks/use-gauntlet";
import { useHollywood } from "./_hooks/use-hollywood";
import { useLcr } from "./_hooks/use-lcr";
import { useMatchplay } from "./_hooks/use-matchplay";
import { useVegas } from "./_hooks/use-vegas";
import { useWolf } from "./_hooks/use-wolf";
import {
    loadActiveMode,
    saveActiveMode,
    saveLastMode,
    saveLastNames,
} from "./_lib/storage";
import type { GameMode } from "./_lib/types";
import { DEFAULT_VEGAS_TEAMS } from "./_lib/vegas/types";

export default function GauntletPage() {
    const gauntlet = useGauntlet();
    const wolf = useWolf();
    const vegas = useVegas();
    const hollywood = useHollywood();
    const lcr = useLcr();
    const matchplay = useMatchplay();

    const [activeMode, setActiveMode] = useState<GameMode | null>(null);
    const [routeReady, setRouteReady] = useState(false);

    const allHydrated =
        gauntlet.hydrated &&
        wolf.hydrated &&
        vegas.hydrated &&
        hollywood.hydrated &&
        lcr.hydrated &&
        matchplay.hydrated;

    useEffect(() => {
        if (!allHydrated) return;
        const stored = loadActiveMode();
        const has: Record<GameMode, boolean> = {
            gauntlet: !!gauntlet.state,
            wolf: !!wolf.state,
            vegas: !!vegas.state,
            hollywood: !!hollywood.state,
            lcr: !!lcr.state,
            matchplay: !!matchplay.state,
        };
        if (stored && has[stored]) {
            setActiveMode(stored);
        } else {
            if (stored !== null) saveActiveMode(null);
            setActiveMode(null);
        }
        setRouteReady(true);
    }, [
        allHydrated,
        gauntlet.state,
        wolf.state,
        vegas.state,
        hollywood.state,
        lcr.state,
        matchplay.state,
    ]);

    const handleStart = useCallback(
        (names: string[], mode: GameMode) => {
            saveLastMode(mode);
            saveLastNames(names);
            saveActiveMode(mode);
            switch (mode) {
                case "gauntlet":
                    gauntlet.startGame(names);
                    break;
                case "wolf":
                    wolf.startGame(names);
                    break;
                case "vegas":
                    vegas.startGame(names, DEFAULT_VEGAS_TEAMS);
                    break;
                case "hollywood":
                    hollywood.startGame(names);
                    break;
                case "lcr":
                    lcr.startGame(names);
                    break;
                case "matchplay":
                    matchplay.startGame(names);
                    break;
            }
            setActiveMode(mode);
        },
        [gauntlet, wolf, vegas, hollywood, lcr, matchplay],
    );

    const handleResetToSetup = useCallback(() => {
        saveActiveMode(null);
        setActiveMode(null);
    }, []);

    if (!routeReady) {
        return (
            <>
                <div className="min-h-screen" />
                <Toaster />
            </>
        );
    }

    if (activeMode === "gauntlet") {
        return (
            <>
                <GauntletShell onResetToSetup={handleResetToSetup} />
                <Toaster />
            </>
        );
    }

    if (activeMode === "wolf") {
        return (
            <>
                <WolfShell onResetToSetup={handleResetToSetup} />
                <Toaster />
            </>
        );
    }

    if (activeMode === "vegas") {
        return (
            <>
                <VegasShell onResetToSetup={handleResetToSetup} />
                <Toaster />
            </>
        );
    }

    if (activeMode === "hollywood") {
        return (
            <>
                <HollywoodShell onResetToSetup={handleResetToSetup} />
                <Toaster />
            </>
        );
    }

    if (activeMode === "lcr") {
        return (
            <>
                <LcrShell onResetToSetup={handleResetToSetup} />
                <Toaster />
            </>
        );
    }

    if (activeMode === "matchplay") {
        return (
            <>
                <MatchplayShell onResetToSetup={handleResetToSetup} />
                <Toaster />
            </>
        );
    }

    return (
        <>
            <Setup onStart={handleStart} />
            <Toaster />
        </>
    );
}
