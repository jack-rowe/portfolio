import { describe, expect, it } from "vitest";
import {
  advanceTarget,
  applyHole,
  chaseOrder,
  finalStandings,
  holeOutcomes,
  lapProgress,
  makeInitialPlayers,
  recompute,
  resetPlayers,
} from "./engine";
import type { Player } from "./types";

function makePlayers(names: string[]): Player[] {
  const total = names.length;
  return names.map((name, i) => ({
    id: `id-${String(i)}`,
    name,
    points: 0,
    targetIndex: (i + 1) % total,
    startTargetIndex: (i + 1) % total,
  }));
}

describe("advanceTarget", () => {
  it("skips the player themselves", () => {
    // Player 0, currently chasing 3 (last). Next would be 0 → self → skip to 1.
    expect(advanceTarget(0, 3, 4)).toBe(1);
  });

  it("wraps around the player count", () => {
    expect(advanceTarget(2, 3, 4)).toBe(0);
  });

  it("advances normally when no self-collision", () => {
    expect(advanceTarget(0, 1, 4)).toBe(2);
  });
});

describe("chaseOrder", () => {
  it("produces a full lap of length total - 1", () => {
    const order = chaseOrder(0, 1, 4);
    expect(order).toHaveLength(3);
    expect(order).toEqual([1, 2, 3]);
  });

  it("excludes the player themselves", () => {
    for (let i = 0; i < 4; i++) {
      const order = chaseOrder(i, (i + 1) % 4, 4);
      expect(order).not.toContain(i);
    }
  });
});

describe("applyHole", () => {
  it("advances target when player beats their target", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    // A (idx 0) chases B (idx 1). A scores 3, B scores 4 → A advances to chasing C (idx 2).
    const next = applyHole(players, [3, 4, 5, 5]);
    expect(next[0].targetIndex).toBe(2);
    expect(next[0].points).toBe(0);
  });

  it("does not advance when score ties or loses", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const next = applyHole(players, [4, 4, 4, 4]);
    expect(next[0].targetIndex).toBe(1);
    expect(next[1].targetIndex).toBe(2);
  });

  it("awards a point and resets target on lap completion", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    // Manually advance A to last opponent in lap (idx 3).
    players[0].targetIndex = 3;
    const next = applyHole(players, [3, 4, 4, 4]);
    expect(next[0].points).toBe(1);
    expect(next[0].targetIndex).toBe(players[0].startTargetIndex);
  });

  it("is pure — does not mutate input", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const snapshot = JSON.stringify(players);
    applyHole(players, [3, 4, 5, 6]);
    expect(JSON.stringify(players)).toBe(snapshot);
  });
});

describe("recompute", () => {
  it("is deterministic — folding same holes yields same result", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const holes = [
      [3, 4, 5, 6],
      [4, 4, 5, 5],
      [3, 4, 4, 4],
      [5, 4, 4, 4],
    ];
    const a = recompute(players, holes);
    const b = recompute(players, holes);
    expect(a).toEqual(b);
  });

  it("equals iterative applyHole", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const holes = [
      [3, 4, 5, 6],
      [5, 4, 4, 4],
    ];
    const iterative = holes.reduce<Player[]>(
      (acc, h) => applyHole(acc, h),
      players,
    );
    expect(recompute(players, holes)).toEqual(iterative);
  });

  it("supports undo via slice", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const holes = [
      [3, 4, 5, 6],
      [4, 5, 5, 5],
      [3, 4, 4, 4],
    ];
    const before = recompute(players, holes.slice(0, 2));
    const after = recompute(players, holes);
    const undone = recompute(players, holes.slice(0, -1));
    expect(undone).toEqual(before);
    expect(undone).not.toEqual(after);
  });
});

describe("lapProgress", () => {
  it("reports 0 beaten at the start of a lap", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    expect(lapProgress(players[0], 0, 4)).toEqual({ beaten: 0, lapLength: 3 });
  });

  it("reports correct progress mid-lap", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].targetIndex = 3; // last opponent in lap
    expect(lapProgress(players[0], 0, 4)).toEqual({ beaten: 2, lapLength: 3 });
  });
});

describe("holeOutcomes", () => {
  it("flags advanced when a player beats their target", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    // A(0)→B(1): 3<4 advance. B(1)→C(2): 4<5 advance.
    // C(2)→D(3): 5<5 no. D(3)→A(0): 5<3 no.
    const matrix = holeOutcomes(players, [[3, 4, 5, 5]]);
    expect(matrix[0][0]).toEqual({ advanced: true, gauntlet: false });
    expect(matrix[0][2]).toEqual({ advanced: false, gauntlet: false });
    expect(matrix[0][3]).toEqual({ advanced: false, gauntlet: false });
  });

  it("flags gauntlet when an advance completes a lap", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].targetIndex = 3; // last opponent in lap
    const matrix = holeOutcomes(players, [[3, 4, 4, 4]]);
    expect(matrix[0][0]).toEqual({ advanced: true, gauntlet: true });
  });

  it("matches recompute over a sequence", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const holes = [
      [3, 4, 5, 6],
      [4, 4, 5, 5],
      [3, 4, 4, 4],
    ];
    const matrix = holeOutcomes(players, holes);
    expect(matrix).toHaveLength(holes.length);
    matrix.forEach((row) => {
      expect(row).toHaveLength(players.length);
    });
  });

  it("returns an empty matrix for zero holes", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    expect(holeOutcomes(players, [])).toEqual([]);
  });

  it("is pure — does not mutate initial players", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const snapshot = JSON.stringify(players);
    holeOutcomes(players, [[3, 4, 4, 4]]);
    expect(JSON.stringify(players)).toBe(snapshot);
  });
});

describe("makeInitialPlayers", () => {
  it("creates correct count with given names", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    expect(players).toHaveLength(4);
    expect(players.map((p) => p.name)).toEqual(["A", "B", "C", "D"]);
  });

  it("starts all players with 0 points", () => {
    const players = makeInitialPlayers(["A", "B", "C"]);
    players.forEach((p) => expect(p.points).toBe(0));
  });

  it("sets each player's initial target to the next player", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    expect(players[0].targetIndex).toBe(1);
    expect(players[1].targetIndex).toBe(2);
    expect(players[2].targetIndex).toBe(3);
    expect(players[3].targetIndex).toBe(0); // wraps around
  });

  it("sets startTargetIndex equal to targetIndex", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    players.forEach((p) => expect(p.targetIndex).toBe(p.startTargetIndex));
  });

  it("assigns unique ids", () => {
    const players = makeInitialPlayers(["A", "B", "C", "D"]);
    const ids = new Set(players.map((p) => p.id));
    expect(ids.size).toBe(4);
  });

  it("works for 3 players", () => {
    const players = makeInitialPlayers(["X", "Y", "Z"]);
    expect(players).toHaveLength(3);
    expect(players[2].targetIndex).toBe(0);
    expect(players[2].startTargetIndex).toBe(0);
  });
});

describe("resetPlayers", () => {
  it("resets points to 0", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 3;
    players[2].points = 1;
    const reset = resetPlayers(players);
    reset.forEach((p) => expect(p.points).toBe(0));
  });

  it("resets targetIndex to (i+1)%total", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].targetIndex = 3; // mid-lap
    const reset = resetPlayers(players);
    expect(reset[0].targetIndex).toBe(1);
    expect(reset[3].targetIndex).toBe(0);
  });

  it("resets startTargetIndex to (i+1)%total", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].startTargetIndex = 3; // shouldn't happen normally but test anyway
    const reset = resetPlayers(players);
    expect(reset[0].startTargetIndex).toBe(1);
  });

  it("preserves player ids and names", () => {
    const players = makePlayers(["Alice", "Bob", "Carol", "Dave"]);
    const reset = resetPlayers(players);
    reset.forEach((r, i) => {
      expect(r.id).toBe(players[i].id);
      expect(r.name).toBe(players[i].name);
    });
  });

  it("is pure — does not mutate input", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 5;
    const snapshot = JSON.stringify(players);
    resetPlayers(players);
    expect(JSON.stringify(players)).toBe(snapshot);
  });
});

describe("3-player game mechanics", () => {
  it("advanceTarget wraps past self with 3 players", () => {
    // Player 1, chasing 2 (last slot). Next = (2+1)%3 = 0. Not self → 0.
    expect(advanceTarget(1, 2, 3)).toBe(0);
    // Player 2, chasing 0. Next = (0+1)%3 = 1. Not self → 1.
    expect(advanceTarget(2, 0, 3)).toBe(1);
    // Player 0, chasing 2 (last). Next = (2+1)%3 = 0. Self → skip → 1.
    expect(advanceTarget(0, 2, 3)).toBe(1);
  });

  it("applyHole advances correctly with 3 players", () => {
    const players = makePlayers(["A", "B", "C"]);
    // A(0)→B(1): 3<4 → advance to C. B(1)→C(2): 5>4 → no. C(2)→A(0): 4>3 → no.
    const next = applyHole(players, [3, 5, 4]);
    expect(next[0].targetIndex).toBe(2); // A advanced to chase C
    expect(next[1].targetIndex).toBe(2); // B stayed
    expect(next[2].targetIndex).toBe(0); // C stayed
  });

  it("lap has length 2 with 3 players", () => {
    const players = makePlayers(["A", "B", "C"]);
    const { lapLength } = lapProgress(players[0], 0, 3);
    expect(lapLength).toBe(2);
  });

  it("awards point and resets on lap completion with 3 players", () => {
    const players = makePlayers(["A", "B", "C"]);
    players[0].targetIndex = 2; // last in lap
    const next = applyHole(players, [3, 4, 4]);
    expect(next[0].points).toBe(1);
    expect(next[0].targetIndex).toBe(players[0].startTargetIndex);
  });

  it("holeOutcomes matrix dimensions are correct for 3 players", () => {
    const players = makePlayers(["A", "B", "C"]);
    const holes = [
      [3, 4, 5],
      [4, 4, 4],
    ];
    const matrix = holeOutcomes(players, holes);
    expect(matrix).toHaveLength(2);
    matrix.forEach((row) => expect(row).toHaveLength(3));
  });

  it("recompute is consistent for a 3-player game", () => {
    const players = makePlayers(["A", "B", "C"]);
    const holes = [
      [3, 4, 5],
      [4, 5, 3],
      [3, 3, 4],
    ];
    const a = recompute(players, holes);
    const b = recompute(players, holes);
    expect(a).toEqual(b);
  });
});

describe("finalStandings", () => {
  it("identifies a single clear winner", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 2;
    const { winner, coWinners, tieBroken } = finalStandings(players);
    expect(winner.name).toBe("A");
    expect(coWinners).toHaveLength(1);
    expect(tieBroken).toBe(false);
  });

  it("identifies a full tie on points and beaten", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    // All at 0 points, all beaten=0 (start of lap)
    const { coWinners } = finalStandings(players);
    expect(coWinners).toHaveLength(4);
    expect(coWinners.map((p) => p.name).sort()).toEqual(["A", "B", "C", "D"]);
  });

  it("identifies two co-winners out of four players when two are fully tied", () => {
    // A and B tied on points=1 and beaten=2; C and D on points=0
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 1;
    players[0].targetIndex = 3; // beaten=2 (chasing last in lap)
    players[1].points = 1;
    players[1].targetIndex = 0; // beaten=2 (chasing last in lap: wraps to idx 0)
    const { coWinners } = finalStandings(players);
    expect(coWinners).toHaveLength(2);
    expect(coWinners.map((p) => p.name).sort()).toEqual(["A", "B"]);
  });

  it("regression: partial points tie with a beaten-tiebreaker still shows co-winners correctly", () => {
    // Bug: A(pts=0,beaten=1), B(pts=0,beaten=1), C(pts=0,beaten=0)
    // Before fix: stillTied=false because C's beaten broke the every() check → showed "A wins"
    // After fix: coWinners=[A,B], stillTied=true
    const players = makePlayers(["A", "B", "C"]);
    players[0].targetIndex = 2; // beaten=1 (chasing idx 2, which is index 1 in chase order)
    players[1].targetIndex = 0; // beaten=1 (chasing idx 0, last in their lap order)
    // C stays at beaten=0
    const { coWinners, tieBroken } = finalStandings(players);
    expect(coWinners).toHaveLength(2);
    expect(coWinners.map((p) => p.name).sort()).toEqual(["A", "B"]);
    expect(tieBroken).toBe(false);
  });

  it("uses beaten count as tiebreaker when points are equal", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[0].points = 1;
    players[0].targetIndex = 3; // beaten=2
    players[1].points = 1;
    // B stays beaten=0
    const { winner, coWinners, tieBroken } = finalStandings(players);
    expect(winner.name).toBe("A");
    expect(coWinners).toHaveLength(1);
    expect(tieBroken).toBe(true);
  });

  it("sorts the full ranking by points then beaten", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    players[2].points = 2; // C is highest
    players[0].points = 1;
    players[0].targetIndex = 3; // A beaten=2
    players[1].points = 1;
    // B beaten=0
    const { winner } = finalStandings(players);
    expect(winner.name).toBe("C");
  });
});
