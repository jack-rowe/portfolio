import { cached, DAY, HOUR } from "./cache";

const BASE = "https://api.sleeper.app/v1";

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  roster_positions: string[];
  scoring_settings: Record<string, number>;
  previous_league_id: string | null;
  settings: Record<string, number>;
  avatar: string | null;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
  players: string[] | null;
  starters: string[] | null;
}

export interface SleeperLeagueUser {
  user_id: string;
  display_name: string;
  metadata?: { team_name?: string };
}

export interface SleeperTradedPick {
  season: string;
  round: number;
  roster_id: number; // original owner
  owner_id: number; // current owner (roster_id)
  previous_owner_id: number;
}

export interface SleeperPlayer {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
  age?: number | null;
  status?: string;
  bye_week?: number | null;
  injury_status?: string | null;
}

export interface SleeperTransaction {
  transaction_id: string;
  type: string; // "trade" | "waiver" | "free_agent"
  status: string; // "complete" | ...
  roster_ids: number[];
  adds: Record<string, number> | null; // player_id -> receiving roster_id
  drops: Record<string, number> | null;
  draft_picks: {
    season: string;
    round: number;
    roster_id: number;
    owner_id: number; // receiving roster
    previous_owner_id: number;
  }[];
  created: number; // ms epoch
  status_updated: number | null;
  leg: number; // week
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number | null;
  points: number;
  players: string[] | null;
  starters: string[] | null;
}

export interface SleeperNflState {
  week: number;
  season: string;
  season_type: string; // "pre" | "regular" | "post" | "off"
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Sleeper ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getUser(username: string): Promise<SleeperUser | null> {
  const res = await fetch(`${BASE}/user/${encodeURIComponent(username)}`);
  if (!res.ok) return null;
  const body = await res.json();
  return body ?? null;
}

export async function getLeagues(
  userId: string,
  season: string
): Promise<SleeperLeague[]> {
  return get<SleeperLeague[]>(`/user/${userId}/leagues/nfl/${season}`);
}

export async function getLeague(leagueId: string): Promise<SleeperLeague> {
  return cached(`league:${leagueId}`, HOUR, () =>
    get<SleeperLeague>(`/league/${leagueId}`)
  );
}

export async function getRosters(leagueId: string): Promise<SleeperRoster[]> {
  return get<SleeperRoster[]>(`/league/${leagueId}/rosters`);
}

export async function getLeagueUsers(
  leagueId: string
): Promise<SleeperLeagueUser[]> {
  return cached(`users:${leagueId}`, HOUR, () =>
    get<SleeperLeagueUser[]>(`/league/${leagueId}/users`)
  );
}

export async function getTradedPicks(
  leagueId: string
): Promise<SleeperTradedPick[]> {
  return cached(`picks:${leagueId}`, HOUR, () =>
    get<SleeperTradedPick[]>(`/league/${leagueId}/traded_picks`)
  );
}

export async function getTransactions(
  leagueId: string,
  week: number
): Promise<SleeperTransaction[]> {
  return cached(`txs:${leagueId}:${week}`, HOUR, () =>
    get<SleeperTransaction[]>(`/league/${leagueId}/transactions/${week}`)
  );
}

export async function getMatchups(
  leagueId: string,
  week: number
): Promise<SleeperMatchup[]> {
  return cached(`matchups:${leagueId}:${week}`, HOUR, () =>
    get<SleeperMatchup[]>(`/league/${leagueId}/matchups/${week}`)
  );
}

// Undocumented but stable: projected stat lines for a week, keyed by player_id.
export async function getProjections(
  season: string,
  week: number
): Promise<Record<string, Record<string, number>>> {
  return cached(`proj:${season}:${week}`, HOUR, () =>
    get<Record<string, Record<string, number>>>(
      `/projections/nfl/regular/${season}/${week}`
    )
  );
}

export async function getNflState(): Promise<SleeperNflState> {
  return cached("state:nfl", HOUR, () => get<SleeperNflState>("/state/nfl"));
}

// ~5MB dump — Sleeper's docs ask that this be fetched at most once a day.
export async function getAllPlayers(): Promise<Record<string, SleeperPlayer>> {
  return cached("players:nfl", DAY, () =>
    get<Record<string, SleeperPlayer>>("/players/nfl")
  );
}
