import {
  getAllPlayers,
  getLeague,
  getLeagueUsers,
  getNflState,
  getProjections,
  getRosters,
  getTradedPicks,
  type SleeperLeague,
} from "./sleeper";
import { formatFromLeague, getValues, type LeagueFormat } from "./fantasycalc";
import {
  buildPickValues,
  buildValueIndex,
  picksForRoster,
  valueRoster,
  type MatchReport,
  type ValuedLeague,
} from "./values";
import type { SleeperPlayer } from "./sleeper";
import type { TeamState } from "./trades";

export interface OwnerInfo {
  displayName: string;
  teamName: string | null;
}

export interface LeagueTeam extends TeamState {
  ownerUserId: string | null;
  owner: OwnerInfo;
}

export interface AssembledLeague {
  league: SleeperLeague;
  format: LeagueFormat;
  teams: LeagueTeam[];
  matchReport: MatchReport;
  nameByUserId: Map<string, string>;
  vl: ValuedLeague; // value index + replacement levels
  pickValues: Map<string, number>; // "season:round" -> value
  players: Record<string, SleeperPlayer>; // full Sleeper dump
}

/** Fetch + join everything: rosters, users, picks, FantasyCalc values. */
export async function assembleLeague(leagueId: string): Promise<AssembledLeague> {
  const league = await getLeague(leagueId);
  const format = formatFromLeague(league);
  const [players, values, rosters, users, tradedPicks, state] = await Promise.all([
    getAllPlayers(),
    getValues(format),
    getRosters(leagueId),
    getLeagueUsers(leagueId),
    format.isDynasty ? getTradedPicks(leagueId) : Promise.resolve([]),
    getNflState().catch(() => null),
  ]);

  // Upcoming-week projected points, scored to this league's PPR setting.
  const projByPlayer = new Map<string, number>();
  if (state && state.season_type === "regular") {
    const week = Math.min(18, Math.max(1, state.week || 1));
    const key =
      format.ppr >= 1 ? "pts_ppr" : format.ppr >= 0.5 ? "pts_half_ppr" : "pts_std";
    try {
      const raw = await getProjections(state.season, week);
      for (const [pid, stats] of Object.entries(raw)) {
        const v = stats?.[key];
        if (typeof v === "number" && v > 0) projByPlayer.set(pid, v);
      }
    } catch {
      /* projections unavailable — leave proj null everywhere */
    }
  }

  const vl = buildValueIndex(values, league);
  const pickValues = format.isDynasty ? buildPickValues(values) : new Map<string, number>();
  const nameByUserId = new Map(
    users.map((u) => [u.user_id, u.metadata?.team_name || u.display_name])
  );
  const ownerByUserId = new Map<string, OwnerInfo>(
    users.map((u) => [
      u.user_id,
      { displayName: u.display_name, teamName: u.metadata?.team_name || null },
    ])
  );
  const allRosterIds = rosters.map((r) => r.roster_id);
  const seasons = [1, 2].map((i) => String(Number(league.season) + i));

  const matchReport: MatchReport = { matched: 0, unmatched: [] };
  const teams: LeagueTeam[] = rosters.map((r) => {
    const { assets, report } = valueRoster(r, players, vl, projByPlayer);
    matchReport.matched += report.matched;
    matchReport.unmatched.push(...report.unmatched);
    if (format.isDynasty) {
      assets.push(
        ...picksForRoster(r.roster_id, allRosterIds, tradedPicks, pickValues, seasons)
      );
    }
    return {
      rosterId: r.roster_id,
      ownerUserId: r.owner_id,
      ownerName: r.owner_id
        ? nameByUserId.get(r.owner_id) ?? `Roster ${r.roster_id}`
        : `Roster ${r.roster_id}`,
      owner: (r.owner_id ? ownerByUserId.get(r.owner_id) : null) ?? {
        displayName: `Roster ${r.roster_id}`,
        teamName: null,
      },
      assets,
    };
  });

  return { league, format, teams, matchReport, nameByUserId, vl, pickValues, players };
}
