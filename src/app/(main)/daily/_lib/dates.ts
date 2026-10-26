/**
 * Calendar-date helpers. Dates are YYYY-MM-DD strings in the device's local
 * time zone, so "today" matches the day the puzzle was played, not UTC.
 */

function pad(n: number): string {
    return String(n).padStart(2, "0");
}

export function toDateKey(date: Date): string {
    return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localToday(): string {
    return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
}

/** Shifts a date key by whole days (negative goes back). Safe across DST changes. */
export function addDays(key: string, days: number): string {
    const date = parseDateKey(key);
    date.setDate(date.getDate() + days);
    return toDateKey(date);
}

export function isDateKey(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(parseDateKey(value)) === value;
}

/** "Fri, Oct 24" */
export function formatDay(key: string): string {
    return parseDateKey(key).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** "Oct 24" */
export function formatShortDay(key: string): string {
    return parseDateKey(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
