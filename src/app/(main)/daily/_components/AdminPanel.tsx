"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn, signOut } from "~firebase/auth";
import { firebaseConfigured } from "~firebase/client";
import { describeError } from "~firebase/scores";
import type { DailyData } from "../_hooks/use-daily-data";
import { useOwner } from "../_hooks/use-owner";
import { Container } from "./Container";
import { EntryPanel } from "./EntryPanel";

type Props = Pick<DailyData, "players" | "games" | "results" | "loading"> & { today: string | null };

/** Sign-in gate around the score entry panel. */
export function AdminPanel({ players, games, results, loading, today }: Props) {
    const owner = useOwner();
    const [error, setError] = useState<string | null>(null);

    const run = (action: () => Promise<void>, verb: string) => {
        setError(null);
        action().catch((err: unknown) => {
            setError(describeError(err, verb));
        });
    };

    const errorLine = error && (
        <p role="alert" className="text-sm text-destructive">
            {error}
        </p>
    );

    if (!firebaseConfigured) {
        return (
            <Container>
                <p className="text-sm text-muted-foreground">
                    Firebase isn&apos;t configured yet. See <code>firebase/README.md</code>.
                </p>
            </Container>
        );
    }

    if (owner.status === "loading") {
        return (
            <Container>
                <p className="text-sm text-muted-foreground">Checking sign-in…</p>
            </Container>
        );
    }

    if (owner.status === "signed-out") {
        return (
            <Container className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">Sign in to add scores.</p>
                <Button
                    type="button"
                    onClick={() => {
                        run(signIn, "sign in");
                    }}
                >
                    Sign in with Google
                </Button>
                {errorLine}
            </Container>
        );
    }

    const signOutButton = (
        <Button
            type="button"
            variant={owner.status === "owner" ? "ghost" : "outline"}
            size="sm"
            onClick={() => {
                run(signOut, "sign out");
            }}
        >
            Sign out
        </Button>
    );

    if (owner.status === "not-owner") {
        return (
            <Container className="flex flex-col items-start gap-3">
                <p className="font-medium">This page is for the board owner.</p>
                <p className="text-sm text-muted-foreground">
                    You&apos;re signed in as {owner.user.email ?? owner.user.name ?? "someone else"}.
                </p>
                {signOutButton}
                {errorLine}
            </Container>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {loading || !today ? (
                <Container>
                    <p className="text-sm text-muted-foreground">Loading…</p>
                </Container>
            ) : (
                <EntryPanel players={players} games={games} results={results} today={today} />
            )}
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <span className="truncate">Signed in as {owner.user.email ?? owner.user.name}</span>
                {signOutButton}
            </div>
            {errorLine}
        </div>
    );
}
