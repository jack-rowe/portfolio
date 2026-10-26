import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, requireAuth } from "./client";

/** The subset of a Firebase user the UI needs. */
export type AuthUser = {
    uid: string;
    name: string | null;
    email: string | null;
};

const OWNER_UID = process.env.NEXT_PUBLIC_FIREBASE_OWNER_UID;

export async function signIn(): Promise<void> {
    await signInWithPopup(requireAuth(), new GoogleAuthProvider());
}

export async function signOut(): Promise<void> {
    await firebaseSignOut(requireAuth());
}

/** Calls back with the signed-in user (or null) now and on every change. Returns an unsubscribe. */
export function watchUser(callback: (user: AuthUser | null) => void): () => void {
    if (!auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, (user) => {
        callback(user ? { uid: user.uid, name: user.displayName, email: user.email } : null);
    });
}

/**
 * Whether this user is the board owner. This only decides what the UI shows;
 * firestore.rules is what actually blocks writes from anyone else.
 */
export function isOwner(user: AuthUser | null): boolean {
    return Boolean(user && OWNER_UID && user.uid === OWNER_UID);
}
