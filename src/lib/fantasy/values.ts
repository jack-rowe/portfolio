import type { FcEntry } from "./fantasycalc";
import type {
  SleeperLeague,
  SleeperPlayer,
  SleeperRoster,
  SleeperTradedPick,
} from "./sleeper";

export const CORE_POSITIONS = ["QB", "RB", "WR", "TE"] as const;
export type CorePosition = (typeof CORE_POSITIONS)[number];

export interface Asset {
  id: string; // sleeper player_id, or "pick:<season>:<round>" for picks
  name: string;
  position: string; // QB/RB/WR/TE/PICK
  team: string | null;
  age: number | null;
  value: number;
  surplus: number; // value over replacement (picks: value as-is)
  overallRank: number | null;
  positionRank: number | null;
  trend30Day: number | null;
  isPick: boolean;
  bye: number | null;
  injury: string | null;
  proj: number | null; // Sleeper projected points, upcoming week
}

export interface MatchReport {
  matched: number;
  unmatched: { id: string; name: string; position: string }[];
}

export interface ValuedLeague {
  valueBySleeperId: Map<string, FcEntry>;
  replacement: Record<CorePosition, number>;
  matchReport: MatchReport;
}

/**
 * Starter demand per position: fixed slots plus a share of FLEX/SUPER_FLEX.
 * FLEX is split by how flex spots actually get used (mostly WR/RB).
 */
export function starterDemand(
  positions: string[]
): Record<CorePosition, number> {
  const demand: Record<CorePosition, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  for (const p of positions) {
    if (p === "QB" || p === "RB" || p === "WR" || p === "TE") demand[p] += 1;
    else if (p === "FLEX" || p === "WRRBTE_FLEX") {
      demand.WR += 0.45;
      demand.RB += 0.4;
      demand.TE += 0.15;
    } else if (p === "WRRB_FLEX") {
      demand.WR += 0.55;
      demand.RB += 0.45;
    } else if (p === "REC_FLEX") {
      demand.WR += 0.8;
      demand.TE += 0.2;
    } else if (p === "SUPER_FLEX") {
      demand.QB += 0.85;
      demand.RB += 0.05;
      demand.WR += 0.1;
    }
  }
  return demand;
}

/**
 * Replacement level per position = value of the nth-ranked player where
 * n = teams x starter demand at that position. Everything downstream uses
 * surplus = value - replacement.
 */
export function computeReplacement(
  entries: FcEntry[],
  league: SleeperLeague
): Record<CorePosition, number> {
  const demand = starterDemand(league.roster_positions ?? []);
  const teams = league.total_rosters ?? 12;
  const out: Record<CorePosition, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  for (const pos of CORE_POSITIONS) {
    const ranked = entries
      .filter((e) => e.player.position === pos)
      .sort((a, b) => b.value - a.value);
    const n = Math.max(1, Math.round(teams * demand[pos]));
    const idx = Math.min(n - 1, ranked.length - 1);
    out[pos] = idx >= 0 ? ranked[idx].value : 0;
  }
  return out;
}

export function buildValueIndex(
  entries: FcEntry[],
  league: SleeperLeague
): ValuedLeague {
  const valueBySleeperId = new Map<string, FcEntry>();
  for (const e of entries) {
    if (e.player.sleeperId) valueBySleeperId.set(String(e.player.sleeperId), e);
  }
  return {
    valueBySleeperId,
    replacement: computeReplacement(entries, league),
    matchReport: { matched: 0, unmatched: [] },
  };
}

/**
 * Convert a Sleeper roster's player ids into valued Assets. Unmatched players
 * (rookies, practice squad) are logged in the match report and valued at 0
 * rather than silently dropped, so totals stay honest and visible.
 */
export function valueRoster(
  roster: SleeperRoster,
  players: Record<string, SleeperPlayer>,
  vl: ValuedLeague,
  proj?: Map<string, number>
): { assets: Asset[]; report: MatchReport } {
  const assets: Asset[] = [];
  const report: MatchReport = { matched: 0, unmatched: [] };
  for (const pid of roster.players ?? []) {
    const sp = players[pid];
    const name =
      sp?.full_name ??
      [sp?.first_name, sp?.last_name].filter(Boolean).join(" ") ??
      pid;
    const position = sp?.position ?? "?";
    // Skip K/DEF etc. — FantasyCalc doesn't value them and they don't trade.
    if (!CORE_POSITIONS.includes(position as CorePosition)) continue;
    const fc = vl.valueBySleeperId.get(pid);
    if (!fc) {
      report.unmatched.push({ id: pid, name, position });
      assets.push({
        id: pid,
        name,
        position,
        team: sp?.team ?? null,
        age: sp?.age ?? null,
        value: 0,
        surplus: 0,
        overallRank: null,
        positionRank: null,
        trend30Day: null,
        isPick: false,
        bye: sp?.bye_week ?? null,
        injury: sp?.injury_status ?? null,
        proj: proj?.get(pid) ?? null,
      });
      continue;
    }
    report.matched++;
    const repl = vl.replacement[position as CorePosition] ?? 0;
    assets.push({
      id: pid,
      name: fc.player.name || name,
      position,
      team: fc.player.maybeTeam ?? sp?.team ?? null,
      age: fc.player.maybeAge ?? sp?.age ?? null,
      value: fc.value,
      surplus: Math.max(0, fc.value - repl),
      overallRank: fc.overallRank ?? null,
      positionRank: fc.positionRank ?? null,
      trend30Day: fc.trend30Day ?? null,
      isPick: false,
      bye: sp?.bye_week ?? null,
      injury: sp?.injury_status ?? null,
      proj: proj?.get(pid) ?? null,
    });
  }
  assets.sort((a, b) => b.value - a.value);
  return { assets, report };
}

// ---- Draft picks (dynasty) -------------------------------------------------

const PICK_RE = /^(\d{4})\s+(?:(early|mid|late)\s+)?(?:round\s+)?(\d)(?:st|nd|rd|th)?$/i;

/** Index FantasyCalc pick entries by "season:round", using the Mid tier
 *  (or the average of tiers) as the generic value for an owned pick. */
export function buildPickValues(entries: FcEntry[]): Map<string, number> {
  const byKey = new Map<string, { sum: number; n: number; mid?: number }>();
  for (const e of entries) {
    const m = PICK_RE.exec(e.player.name.trim());
    if (!m) continue;
    const key = `${m[1]}:${m[3]}`;
    const cur = byKey.get(key) ?? { sum: 0, n: 0 };
    cur.sum += e.value;
    cur.n += 1;
    if ((m[2] ?? "").toLowerCase() === "mid") cur.mid = e.value;
    byKey.set(key, cur);
  }
  const out = new Map<string, number>();
  for (const [key, v] of byKey) out.set(key, v.mid ?? Math.round(v.sum / v.n));
  return out;
}

/**
 * Which future picks does each roster own? Default: every roster owns its own
 * picks for the next few seasons; traded_picks moves them.
 */
export function picksForRoster(
  rosterId: number,
  allRosterIds: number[],
  tradedPicks: SleeperTradedPick[],
  pickValues: Map<string, number>,
  seasons: string[]
): Asset[] {
  const out: Asset[] = [];
  for (const season of seasons) {
    for (const round of [1, 2, 3]) {
      const key = `${season}:${round}`;
      const value = pickValues.get(key);
      if (!value) continue; // no FC value for this pick — exclude rather than guess
      for (const original of allRosterIds) {
        const trade = tradedPicks
          .filter(
            (t) =>
              t.season === season && t.round === round && t.roster_id === original
          )
          .pop();
        const owner = trade ? trade.owner_id : original;
        if (owner !== rosterId) continue;
        const ordinal = round === 1 ? "1st" : round === 2 ? "2nd" : "3rd";
        out.push({
          id: `pick:${season}:${round}:${original}`,
          name: `${season} ${ordinal}`,
          position: "PICK",
          team: null,
          age: null,
          value,
          surplus: value, // picks have no lineup slot; treat value as surplus
          overallRank: null,
          positionRank: null,
          trend30Day: null,
          isPick: true,
          bye: null,
          injury: null,
          proj: null,
        });
      }
    }
  }
  return out.sort((a, b) => b.value - a.value);
}
