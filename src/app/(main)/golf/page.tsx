"use client";

import { useCallback, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { GauntletShell } from "./_components/gauntlet/GauntletShell";
import { HollywoodShell } from "./_components/hollywood/HollywoodShell";
import { LcrShell } from "./_components/lcr/LcrShell";
import { MatchplayShell } from "./_components/matchplay/MatchplayShell";
import { ScrambleShell } from "./_components/scramble/ScrambleShell";
import { Setup } from "./_components/Setup";
import { StrokeplayShell } from "./_components/strokeplay/StrokeplayShell";
import { VegasShell } from "./_components/vegas/VegasShell";
import { WolfShell } from "./_components/wolf/WolfShell";
import { useGauntlet } from "./_hooks/use-gauntlet";
import { useHollywood } from "./_hooks/use-hollywood";
import { useLcr } from "./_hooks/use-lcr";
import { useMatchplay } from "./_hooks/use-matchplay";
import { useScramble } from "./_hooks/use-scramble";
import { useStrokeplay } from "./_hooks/use-strokeplay";
import { useVegas } from "./_hooks/use-vegas";
import { useWolf } from "./_hooks/use-wolf";
import {
    loadActiveMode,
    saveActiveMode,
    saveLastMode,
    saveLastNames,
} from "./_lib/storage";
import type { GameMode } from "./_lib/types";
import type { HandicapConfig } from "./_lib/handicap";
import type {
    ScrambleFormat,
    ScrambleLayout,
} from "./_lib/scramble/types";
import { DEFAULT_VEGAS_TEAMS } from "./_lib/vegas/types";

export default function GauntletPage() {
    const gauntlet = useGauntlet();
    const wolf = useWolf();
    const vegas = useVegas();
    const hollywood = useHollywood();
    const lcr = useLcr();
    const matchplay = useMatchplay();
    const strokeplay = useStrokeplay();
    const scramble = useScramble();

    const [activeMode, setActiveMode] = useState<GameMode | null>(null);
    const [routeReady, setRouteReady] = useState(false);

    const allHydrated =
        gauntlet.hydrated &&
        wolf.hydrated &&
        vegas.hydrated &&
        hollywood.hydrated &&
        lcr.hydrated &&
        matchplay.hydrated &&
        strokeplay.hydrated &&
        scramble.hydrated;

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
            strokeplay: !!strokeplay.state,
            scramble: !!scramble.state,
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
        strokeplay.state,
        scramble.state,
    ]);

    const handleStart = useCallback(
        (
            names: string[],
            mode: GameMode,
            opts?: {
                handicap?: HandicapConfig;
                scrambleLayout?: ScrambleLayout;
                scrambleFormat?: ScrambleFormat;
            },
        ) => {
            saveLastMode(mode);
            saveLastNames(names);
            saveActiveMode(mode);
            const handicap = opts?.handicap;
            switch (mode) {
                case "gauntlet":
                    gauntlet.startGame(names, { handicap });
                    break;
                case "wolf":
                    wolf.startGame(names, { handicap });
                    break;
                case "vegas":
                    vegas.startGame(names, {
                        ...DEFAULT_VEGAS_TEAMS,
                        handicap,
                    });
                    break;
                case "hollywood":
                    hollywood.startGame(names, { handicap });
                    break;
                case "lcr":
                    lcr.startGame(names, { handicap });
                    break;
                case "matchplay":
                    matchplay.startGame(names, { handicap });
                    break;
                case "strokeplay":
                    strokeplay.startGame(names, {
                        handicap,
                        handicaps: handicap?.handicaps,
                    });
                    break;
                case "scramble":
                    scramble.startGame(names, {
                        handicap,
                        layout: opts?.scrambleLayout ?? "2v2",
                        format: opts?.scrambleFormat ?? "matchplay",
                    });
                    break;
            }
            setActiveMode(mode);
        },
        [gauntlet, wolf, vegas, hollywood, lcr, matchplay, strokeplay, scramble],
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

    if (activeMode === "strokeplay") {
        return (
            <>
                <StrokeplayShell onResetToSetup={handleResetToSetup} />
                <Toaster />
            </>
        );
    }

    if (activeMode === "scramble") {
        return (
            <>
                <ScrambleShell onResetToSetup={handleResetToSetup} />
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
