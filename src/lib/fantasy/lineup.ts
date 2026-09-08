import type { Asset } from "./values";

export const SLOT_ELIGIBILITY: Record<string, string[]> = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  FLEX: ["RB", "WR", "TE"],
  WRRBTE_FLEX: ["RB", "WR", "TE"],
  WRRB_FLEX: ["RB", "WR"],
  REC_FLEX: ["WR", "TE"],
  SUPER_FLEX: ["QB", "RB", "WR", "TE"],
};

function orderedSlots(rosterPositions: string[]): string[] {
  // Fixed slots before flex slots so flex picks from true leftovers.
  return rosterPositions
    .filter((p) => SLOT_ELIGIBILITY[p])
    .sort((a, b) => SLOT_ELIGIBILITY[a].length - SLOT_ELIGIBILITY[b].length);
}

function greedyFill(pool: Asset[], slots: string[]): { total: number; used: Set<string> } {
  const used = new Set<string>();
  let total = 0;
  for (const slot of slots) {
    const eligible = SLOT_ELIGIBILITY[slot];
    for (const p of pool) {
      if (!used.has(p.id) && eligible.includes(p.position)) {
        used.add(p.id);
        total += p.value;
        break;
      }
    }
  }
  return { total, used };
}

/**
 * Optimal-starting-lineup value: fill fixed slots greedily by value, then flex
 * slots from what's left. Greedy is optimal enough for ranking trades.
 */
export function lineupValue(assets: Asset[], rosterPositions: string[]): number {
  const pool = assets.filter((a) => !a.isPick).sort((x, y) => y.value - x.value);
  return greedyFill(pool, orderedSlots(rosterPositions)).total;
}

/** Ids of players who make the optimal lineup (used to mark bench/surplus). */
export function starterIds(assets: Asset[], rosterPositions: string[]): Set<string> {
  const pool = assets.filter((a) => !a.isPick).sort((x, y) => y.value - x.value);
  return greedyFill(pool, orderedSlots(rosterPositions)).used;
}

export interface LineupSlot {
  slot: string;
  player: Asset | null;
}

/**
 * The optimal lineup as slot assignments, in the league's display order.
 * Same fill logic as lineupValue (fixed slots first, then flex), so the two
 * always agree.
 */
export function lineupSlots(assets: Asset[], rosterPositions: string[]): LineupSlot[] {
  const slotDefs = rosterPositions
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => SLOT_ELIGIBILITY[p]);
  const ordered = [...slotDefs].sort(
    (a, b) => SLOT_ELIGIBILITY[a.p].length - SLOT_ELIGIBILITY[b.p].length
  );
  const pool = assets.filter((a) => !a.isPick).sort((x, y) => y.value - x.value);
  const used = new Set<string>();
  const byIndex = new Map<number, Asset | null>();
  for (const { p, i } of ordered) {
    const eligible = SLOT_ELIGIBILITY[p];
    const pick =
      pool.find((a) => !used.has(a.id) && eligible.includes(a.position)) ?? null;
    if (pick) used.add(pick.id);
    byIndex.set(i, pick);
  }
  return slotDefs.map(({ p, i }) => ({ slot: p, player: byIndex.get(i) ?? null }));
}

/**
 * A reusable evaluator for one roster: pre-sorts the player pool once, then
 * each call merges a small add/remove delta in O(n) — no per-trade sorting.
 * This is what keeps the two-sided package search fast enough to run
 * thousands of candidate evaluations per opponent.
 */
export function makeLineupEvaluator(
  assets: Asset[],
  rosterPositions: string[]
): (removeIds: ReadonlySet<string>, add: readonly Asset[]) => number {
  const slots = orderedSlots(rosterPositions);
  const base = assets.filter((a) => !a.isPick).sort((x, y) => y.value - x.value);
  return (removeIds, add) => {
    const addSorted = add
      .filter((a) => !a.isPick)
      .slice()
      .sort((x, y) => y.value - x.value);
    const pool: Asset[] = [];
    let i = 0;
    let j = 0;
    while (i < base.length || j < addSorted.length) {
      const b = i < base.length ? base[i] : null;
      if (b && removeIds.has(b.id)) {
        i++;
        continue;
      }
      const a = j < addSorted.length ? addSorted[j] : null;
      if (b && (!a || b.value >= a.value)) {
        pool.push(b);
        i++;
      } else if (a) {
        pool.push(a);
        j++;
      }
    }
    return greedyFill(pool, slots).total;
  };
}
