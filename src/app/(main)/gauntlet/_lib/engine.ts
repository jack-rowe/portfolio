import type { HoleScores, Player } from "./types";

/** Advance a single player's target by one slot, skipping themselves. */
export function advanceTarget(
  playerIdx: number,
  currentTarget: number,
  total: number,
): number {
  let next = (currentTarget + 1) % total;
  if (next === playerIdx) next = (next + 1) % total;
  return next;
}

/**
 * Ordered list of targets the player chases in one full lap, starting at
 * `startTarget`. Length is always `total - 1`.
 */
export function chaseOrder(
  playerIdx: number,
  startTarget: number,
  total: number,
): number[] {
  const order: number[] = [];
  let t = startTarget;
  for (let i = 0; i < total - 1; i++) {
    order.push(t);
    t = advanceTarget(playerIdx, t, total);
  }
  return order;
}

/** Apply a single hole's scores to the player list, returning a new array. */
export function applyHole(players: Player[], scores: HoleScores): Player[] {
  const total = players.length;
  return players.map((p, i) => {
    const myScore = scores[i];
    const targetScore = scores[p.targetIndex];
    if (myScore >= targetScore) return { ...p };
    const next = advanceTarget(i, p.targetIndex, total);
    if (next === p.startTargetIndex) {
      // Completed a full lap → score a point and reset to start target.
      return { ...p, points: p.points + 1, targetIndex: p.startTargetIndex };
    }
    return { ...p, targetIndex: next };
  });
}

/** Fold an entire list of holes from an initial player state. */
export function recompute(
  initialPlayers: Player[],
  holes: HoleScores[],
): Player[] {
  return holes.reduce<Player[]>(
    (players, scores) => applyHole(players, scores),
    initialPlayers,
  );
}

/** Construct the starting Player array for a fresh game. */
export function makeInitialPlayers(names: string[]): Player[] {
  const total = names.length;
  return names.map((name, i) => ({
    id: makeId(i),
    name,
    points: 0,
    targetIndex: (i + 1) % total,
    startTargetIndex: (i + 1) % total,
  }));
}

/** Reset points and targets but keep ids and names, for full recompute. */
export function resetPlayers(players: Player[]): Player[] {
  const total = players.length;
  return players.map((p, i) => ({
    ...p,
    points: 0,
    targetIndex: (i + 1) % total,
    startTargetIndex: (i + 1) % total,
  }));
}

export type LapProgress = { beaten: number; lapLength: number };

/** Per-hole outcome for one player. */
export type HoleOutcome = {
  /** True when this player beat their target on this hole. */
  advanced: boolean;
  /** True when this advance also completed a lap (scored a gauntlet). */
  gauntlet: boolean;
};

/**
 * Derive per-hole outcomes for each player by folding through the holes.
 * Returns a matrix indexed `[holeIndex][playerIndex]`.
 */
export function holeOutcomes(
  initialPlayers: Player[],
  holes: HoleScores[],
): HoleOutcome[][] {
  const matrix: HoleOutcome[][] = [];
  let players = initialPlayers;
  for (const scores of holes) {
    const before = players;
    const after = applyHole(before, scores);
    matrix.push(
      before.map((p, i) => ({
        advanced: scores[i] < scores[p.targetIndex],
        gauntlet: after[i].points > p.points,
      })),
    );
    players = after;
  }
  return matrix;
}

/** Number of opponents beaten so far on the current lap. */
export function lapProgress(
  player: Player,
  playerIdx: number,
  total: number,
): LapProgress {
  const order = chaseOrder(playerIdx, player.startTargetIndex, total);
  return {
    beaten: Math.max(0, order.indexOf(player.targetIndex)),
    lapLength: total - 1,
  };
}

export type RankedPlayer = Player & {
  idx: number;
  beaten: number;
  lapLength: number;
};

export type FinalStandings = {
  /** The single winner, or first alphabetically in a full tie — use coWinners to detect. */
  winner: RankedPlayer;
  /** All players who share the top points AND beaten count. Length > 1 means a true tie. */
  coWinners: RankedPlayer[];
  /** True when the points leader is decided by beaten count (not a clean sweep). */
  tieBroken: boolean;
};

/**
 * Derive final standings from the post-game player list.
 * Primary sort: points descending. Secondary: lap progress (beaten) descending.
 */
export function finalStandings(players: Player[]): FinalStandings {
  const total = players.length;
  const ranked: RankedPlayer[] = players
    .map((p, idx) => {
      const { beaten, lapLength } = lapProgress(p, idx, total);
      return { ...p, idx, beaten, lapLength };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.beaten - a.beaten;
    });

  const winner = ranked[0];
  const coWinners = ranked.filter(
    (p) => p.points === winner.points && p.beaten === winner.beaten,
  );
  const tiedOnPoints = ranked.filter((p) => p.points === winner.points);
  const tieBroken = tiedOnPoints.length > 1 && coWinners.length === 1;

  return { winner, coWinners, tieBroken };
}

function makeId(seed: number): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `p-${String(seed)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
