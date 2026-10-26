"use client";

import { useEffect, useState } from "react";
import { isOwner, watchUser, type AuthUser } from "~firebase/auth";

export type OwnerState =
    | { status: "loading" }
    | { status: "signed-out" }
    | { status: "not-owner"; user: AuthUser }
    | { status: "owner"; user: AuthUser };

export function useOwner(): OwnerState {
    const [state, setState] = useState<OwnerState>({ status: "loading" });

    useEffect(
        () =>
            watchUser((user) => {
                if (!user) setState({ status: "signed-out" });
                else setState({ status: isOwner(user) ? "owner" : "not-owner", user });
            }),
        [],
    );

    return state;
}
