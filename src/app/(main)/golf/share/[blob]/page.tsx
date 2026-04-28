"use client";

import { useMemo, use } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { GauntletRecap } from "../../_components/gauntlet/Recap";
import { WolfRecap } from "../../_components/wolf/Recap";
import { VegasRecap } from "../../_components/vegas/Recap";
import { HollywoodRecap } from "../../_components/hollywood/Recap";
import { LcrRecap } from "../../_components/lcr/Recap";
import { MatchplayRecap } from "../../_components/matchplay/Recap";
import { StrokeplayRecap } from "../../_components/strokeplay/Recap";
import { StablefordRecap } from "../../_components/stableford/Recap";
import { ScrambleRecap } from "../../_components/scramble/Recap";
import type { DecodedShare } from "../../_lib/share";
import { decodeShare } from "../../_lib/share";

const RECAP_RENDERERS: {
    [K in DecodedShare["kind"]]: (
        state: Extract<DecodedShare, { kind: K }>["state"],
    ) => React.ReactElement;
} = {
    gauntlet: (s) => <GauntletRecap state={s} />,
    wolf: (s) => <WolfRecap state={s} />,
    vegas: (s) => <VegasRecap state={s} />,
    hollywood: (s) => <HollywoodRecap state={s} />,
    lcr: (s) => <LcrRecap state={s} />,
    matchplay: (s) => <MatchplayRecap state={s} />,
    strokeplay: (s) => <StrokeplayRecap state={s} />,
    stableford: (s) => <StablefordRecap state={s} />,
    scramble: (s) => <ScrambleRecap state={s} />,
};

function renderRecap(decoded: DecodedShare): React.ReactElement {
    const render = RECAP_RENDERERS[decoded.kind] as (
        s: DecodedShare["state"],
    ) => React.ReactElement;
    return render(decoded.state);
}

function ShareError({ message }: { message: string }) {
    return (
        <div className="min-h-screen px-4 max-w-2xl mx-auto py-16 flex flex-col items-center text-center gap-4">
            <AlertTriangle
                aria-hidden="true"
                className="w-10 h-10 text-muted-foreground"
            />
            <h1 className="font-clash text-2xl font-bold">
                Cannot load shared round
            </h1>
            <p className="text-sm text-muted-foreground max-w-md">{message}</p>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/golf">
                    <ChevronLeft aria-hidden="true" className="w-3.5 h-3.5" />{" "}
                    Back to Golf
                </Link>
            </Button>
        </div>
    );
}

export default function GolfSharePage({
    params,
}: {
    params: Promise<{ blob: string }>;
}) {
    const { blob } = use(params);
    const decoded = useMemo(() => decodeShare(blob), [blob]);

    return (
        <>
            {decoded ? (
                renderRecap(decoded)
            ) : (
                <ShareError message="This share link is invalid or was created with a different version." />
            )}
            <Toaster />
        </>
    );
}
