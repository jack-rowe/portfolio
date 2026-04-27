import type { ZodType } from "zod";

/**
 * Generic localStorage wrapper validated by a zod schema. Each mode's
 * engine owns one of these for its persisted state.
 */
export class GameStorage<TState> {
  constructor(
    public readonly key: string,
    private readonly schema: ZodType<TState>,
  ) {}

  parse(raw: unknown): TState | null {
    const result = this.schema.safeParse(raw);
    if (!result.success) return null;
    return result.data;
  }

  load(): TState | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      const valid = this.parse(parsed);
      if (!valid) {
        window.localStorage.removeItem(this.key);
        return null;
      }
      return valid;
    } catch {
      return null;
    }
  }

  save(state: TState | null): void {
    if (typeof window === "undefined") return;
    if (state === null) {
      window.localStorage.removeItem(this.key);
      return;
    }
    try {
      window.localStorage.setItem(this.key, JSON.stringify(state));
    } catch {
      // Storage full / unavailable — ignore; game still works in-memory.
    }
  }
}
