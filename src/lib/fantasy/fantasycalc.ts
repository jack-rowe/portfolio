import { cached, DAY } from "./cache";
import type { SleeperLeague } from "./sleeper";

// Undocumented endpoint — cache 24h, never hammer it.
const BASE = "https://api.fantasycalc.com/values/current";

export interface FcEntry {
  player: {
    id: number;
    name: string;
    mflId?: string | null;
    sleeperId?: string | null;
    position: string; // QB/RB/WR/TE ... picks show up as "PICK"-ish names
    maybeBirthday?: string | null;
    maybeAge?: number | null;
    maybeTeam?: string | null;
  };
  value: number;
  overallRank: number;
  positionRank: number | null;
  trend30Day: number | null;
  redraftValue?: number;
}

export interface LeagueFormat {
  isDynasty: boolean;
  numQbs: number;
  numTeams: number;
  ppr: number;
}

// Derive FantasyCalc query params from real league settings — a superflex
// league queried with numQbs=1 returns garbage QB values.
export function formatFromLeague(league: SleeperLeague): LeagueFormat {
  const positions = league.roster_positions ?? [];
  const qbSlots = positions.filter((p) => p === "QB").length;
  const sfSlots = positions.filter((p) => p === "SUPER_FLEX").length;
  const numQbs = qbSlots + sfSlots >= 2 ? 2 : 1;
  const rec = league.scoring_settings?.rec ?? 0;
  const ppr = rec >= 0.75 ? 1 : rec >= 0.25 ? 0.5 : 0;
  return {
    // settings.type: 0 = redraft, 1 = keeper, 2 = dynasty. Do NOT infer from
    // previous_league_id — renewed redraft leagues have one too.
    isDynasty: league.settings?.type === 2,
    numQbs,
    numTeams: league.total_rosters ?? 12,
    ppr,
  };
}

export async function getValues(format: LeagueFormat): Promise<FcEntry[]> {
  const params = new URLSearchParams({
    isDynasty: String(format.isDynasty),
    numQbs: String(format.numQbs),
    numTeams: String(format.numTeams),
    ppr: String(format.ppr),
  });
  const key = `fc:${params.toString()}`;
  return cached(key, DAY, async () => {
    const res = await fetch(`${BASE}?${params}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`FantasyCalc failed: ${res.status}`);
    return res.json() as Promise<FcEntry[]>;
  });
}
