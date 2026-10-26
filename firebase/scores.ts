import {
    collection,
    deleteDoc,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    type DocumentData,
    type Query,
    type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db, requireDb } from "./client";
import type { Game, NewGame, NewResult, Player, Result, ScoreType } from "./types";

const RESULT_LIMIT = 1000;
const WRITE_TIMEOUT_MS = 10_000;
// Matches the slug length limit in firestore.rules.
const MAX_SLUG_LENGTH = 40;

type Unsubscribe = () => void;
type OnError = (message: string) => void;

/** "Mini Crossword" -> "mini-crossword". Empty if the name has no letters or digits. */
export function slugify(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFKD")
        .replaceAll(/[̀-ͯ]/g, "")
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .join("-")
        .slice(0, MAX_SLUG_LENGTH)
        .replace(/-$/, "");
}

export function resultId(game: string, date: string, player: string): string {
    return `${game}-${date}-${player}`;
}

const AUTH_MESSAGES: Record<string, string> = {
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups and try again.",
};

/** Turns a Firebase error into a sentence a person can act on. */
export function describeError(err: unknown, action = "save"): string {
    const code = typeof err === "object" && err && "code" in err && typeof err.code === "string" ? err.code : "";
    if (code === "permission-denied") return `You don't have permission to ${action}. Sign in as the board owner.`;
    if (code in AUTH_MESSAGES) return AUTH_MESSAGES[code];
    // Errors we throw ourselves (duplicate names etc.) already read well.
    if (!code && err instanceof Error && err.message) return err.message;
    return `Couldn't ${action}. Check your connection.`;
}

// Firestore keeps offline writes queued and never rejects them, so give up after a while
// rather than leaving the Save button spinning forever.
async function withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            reject(Object.assign(new Error("timeout"), { code: "timeout" }));
        }, WRITE_TIMEOUT_MS);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timer);
    }
}

function millis(snap: QueryDocumentSnapshot<DocumentData>): number {
    // "estimate" fills in pending server timestamps on local writes instead of null.
    const ts = snap.get("createdAt", { serverTimestamps: "estimate" }) as { toMillis?: () => number } | null;
    return ts?.toMillis?.() ?? 0;
}

function toPlayer(snap: QueryDocumentSnapshot<DocumentData>): Player {
    const d = snap.data();
    return { slug: snap.id, name: String(d.name), createdAt: millis(snap) };
}

function toGame(snap: QueryDocumentSnapshot<DocumentData>): Game {
    const d = snap.data();
    const game: Game = { slug: snap.id, name: String(d.name), type: d.type as ScoreType, createdAt: millis(snap) };
    if (typeof d.max === "number") game.max = d.max;
    if (typeof d.canFail === "boolean") game.canFail = d.canFail;
    if (typeof d.higherWins === "boolean") game.higherWins = d.higherWins;
    return game;
}

function toResult(snap: QueryDocumentSnapshot<DocumentData>): Result {
    const d = snap.data();
    return {
        id: snap.id,
        game: String(d.game),
        gameName: String(d.gameName),
        player: String(d.player),
        date: String(d.date),
        score: Number(d.score),
        fail: Boolean(d.fail),
        shown: String(d.shown),
        createdAt: millis(snap),
    };
}

function watch<T>(
    q: Query<DocumentData>,
    map: (snap: QueryDocumentSnapshot<DocumentData>) => T,
    onData: (items: T[]) => void,
    onError?: OnError,
): Unsubscribe {
    return onSnapshot(
        q,
        (snap) => {
            onData(snap.docs.map(map));
        },
        (err) => {
            onError?.(describeError(err, "load scores"));
        },
    );
}

function notConfigured(onError?: OnError): Unsubscribe {
    onError?.("The scoreboard isn't set up yet. Add the Firebase env vars.");
    return () => {};
}

/** Players in the order they were added. */
export function watchPlayers(onData: (players: Player[]) => void, onError?: OnError): Unsubscribe {
    if (!db) return notConfigured(onError);
    return watch(query(collection(db, "players"), orderBy("createdAt", "asc")), toPlayer, onData, onError);
}

/** Games in the order they were added. */
export function watchGames(onData: (games: Game[]) => void, onError?: OnError): Unsubscribe {
    if (!db) return notConfigured(onError);
    return watch(query(collection(db, "games"), orderBy("createdAt", "asc")), toGame, onData, onError);
}

/** The newest 1000 results, newest day first. */
export function watchResults(onData: (results: Result[]) => void, onError?: OnError): Unsubscribe {
    if (!db) return notConfigured(onError);
    return watch(
        query(collection(db, "results"), orderBy("date", "desc"), limit(RESULT_LIMIT)),
        toResult,
        onData,
        onError,
    );
}

/** Adds a player and returns their slug. Throws a readable Error if the name is taken. */
export async function addPlayer(name: string): Promise<string> {
    const trimmed = name.trim();
    const slug = slugify(trimmed);
    if (!slug) throw new Error("Use at least one letter or number in the name.");
    const firestore = requireDb();
    const ref = doc(firestore, "players", slug);
    await withTimeout(
        runTransaction(firestore, async (tx) => {
            const existing = await tx.get(ref);
            if (existing.exists()) {
                // Renamed players keep their original slug, so the clash may be with a different name.
                const current = String(existing.get("name"));
                throw new Error(
                    current === trimmed
                        ? `There's already a player called ${trimmed}.`
                        : `${trimmed} is too close to ${current}'s original name. Try a different name.`,
                );
            }
            tx.set(ref, { name: trimmed, createdAt: serverTimestamp() });
        }),
    );
    return slug;
}

/**
 * Changes a player's display name. The slug (document ID) stays the same,
 * so their results stay linked.
 */
export async function renamePlayer(slug: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Give the player a name.");
    await withTimeout(updateDoc(doc(requireDb(), "players", slug), { name: trimmed }));
}

/** Adds a game and returns its slug. Throws a readable Error if the name is taken. */
export async function addGame(game: NewGame): Promise<string> {
    const name = game.name.trim();
    const slug = slugify(name);
    if (!slug) throw new Error("Use at least one letter or number in the name.");
    const firestore = requireDb();
    const ref = doc(firestore, "games", slug);
    // Firestore rejects undefined fields, so only include the options that are set.
    const data: DocumentData = { name, type: game.type, createdAt: serverTimestamp() };
    if (game.max !== undefined) data.max = game.max;
    if (game.canFail !== undefined) data.canFail = game.canFail;
    if (game.higherWins !== undefined) data.higherWins = game.higherWins;
    await withTimeout(
        runTransaction(firestore, async (tx) => {
            if ((await tx.get(ref)).exists()) throw new Error(`There's already a game called ${name}.`);
            tx.set(ref, data);
        }),
    );
    return slug;
}

/** Removes the game from the board. Its results stay in Firestore. */
export async function removeGame(slug: string): Promise<void> {
    await withTimeout(deleteDoc(doc(requireDb(), "games", slug)));
}

/** Saves a result, overwriting any earlier one for the same game, day and player. */
export async function saveResult(result: NewResult): Promise<void> {
    const id = resultId(result.game, result.date, result.player);
    await withTimeout(setDoc(doc(requireDb(), "results", id), { ...result, createdAt: serverTimestamp() }));
}

export async function deleteResult(id: string): Promise<void> {
    await withTimeout(deleteDoc(doc(requireDb(), "results", id)));
}
