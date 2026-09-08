import { lineupSlots } from "./lineup";
import { CORE_POSITIONS, type Asset } from "./values";

export interface PosRankChange {
  pos: string;
  before: number; // league rank of this team's positional starters, pre-trade
  after: number; // rank if the trade goes through
  teams: number;
}

/** Combined value of a roster's optimal starters at each position
 *  (flex starters counted at their real position). */
function posValues(assets: Asset[], rosterPositions: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const pos of CORE_POSITIONS) out[pos] = 0;
  for (const s of lineupSlots(assets, rosterPositions)) {
    if (s.player && s.player.position in out) out[s.player.position] += s.player.value;
  }
  return out;
}

/**
 * League-wide positional rank changes for the rosters altered by a trade.
 * `afterByRosterId` holds the post-trade assets of the (usually two) teams in
 * the deal; everyone else's values are unchanged, but both movers shift
 * simultaneously when ranking the "after" state.
 */
export function positionalRankChanges(
  teams: { rosterId: number; assets: Asset[] }[],
  rosterPositions: string[],
  afterByRosterId: Map<number, Asset[]>
): Map<number, PosRankChange[]> {
  const before = new Map(
    teams.map((t) => [t.rosterId, posValues(t.assets, rosterPositions)])
  );
  const after = new Map(
    teams.map((t) => {
      const changed = afterByRosterId.get(t.rosterId);
      return [
        t.rosterId,
        changed ? posValues(changed, rosterPositions) : before.get(t.rosterId)!,
      ] as const;
    })
  );

  const rankOf = (
    vals: Map<number, Record<string, number>>,
    rid: number,
    pos: string
  ) =>
    1 +
    teams.filter(
      (t) => t.rosterId !== rid && vals.get(t.rosterId)![pos] > vals.get(rid)![pos]
    ).length;

  const result = new Map<number, PosRankChange[]>();
  for (const rid of afterByRosterId.keys()) {
    result.set(
      rid,
      CORE_POSITIONS.map((pos) => ({
        pos,
        before: rankOf(before, rid, pos),
        after: rankOf(after, rid, pos),
        teams: teams.length,
      }))
    );
  }
  return result;
}
