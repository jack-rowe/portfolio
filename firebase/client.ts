import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** False when the env vars are missing, so pages can say so instead of crashing the build. */
export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

// Reuse the existing app across hot reloads and repeated imports.
const app: FirebaseApp | null = firebaseConfigured
    ? getApps().length > 0
        ? getApp()
        : initializeApp(config)
    : null;

export const db: Firestore | null = app ? getFirestore(app) : null;

// Auth only makes sense in the browser (popups, persistence), so skip it during SSR.
export const auth: Auth | null = app && typeof window !== "undefined" ? getAuth(app) : null;

export function requireDb(): Firestore {
    if (!db) throw new Error("Firebase isn't configured. Add the NEXT_PUBLIC_FIREBASE_* env vars.");
    return db;
}

export function requireAuth(): Auth {
    if (!auth) throw new Error("Firebase isn't configured. Add the NEXT_PUBLIC_FIREBASE_* env vars.");
    return auth;
}
