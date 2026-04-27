import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "./share";
import type { GauntletState } from "./gauntlet/types";

const sampleGauntlet: GauntletState = {
  mode: "gauntlet",
  players: [
    {
      id: "p1",
      name: "Alice",
      points: 2,
      targetIndex: 1,
      startTargetIndex: 1,
    },
    {
      id: "p2",
      name: "Bob",
      points: 1,
      targetIndex: 2,
      startTargetIndex: 2,
    },
    {
      id: "p3",
      name: "Carol",
      points: 0,
      targetIndex: 0,
      startTargetIndex: 0,
    },
  ],
  holes: [
    [4, 5, 6],
    [3, 4, 5],
  ],
  finishedAt: 2,
};

describe("share encode/decode", () => {
  it("roundtrips a gauntlet state", () => {
    const blob = encodeShare(sampleGauntlet);
    expect(typeof blob).toBe("string");
    expect(blob.length).toBeGreaterThan(0);
    // base64url charset: no +, /, or =
    expect(blob).toMatch(/^[A-Za-z0-9_-]+$/);

    const decoded = decodeShare(blob);
    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(decoded.kind).toBe("gauntlet");
    expect(decoded.state).toEqual(sampleGauntlet);
  });

  it("returns null for malformed blobs", () => {
    expect(decodeShare("")).toBeNull();
    expect(decodeShare("!!!not-base64!!!")).toBeNull();
    expect(decodeShare("Zm9v")).toBeNull(); // valid base64 but not JSON envelope
  });

  it("returns null when the inner state fails schema validation", () => {
    const bad = encodeShare({
      ...sampleGauntlet,
      // Negative points violate the schema.
      players: [
        { ...sampleGauntlet.players[0], points: -1 },
        sampleGauntlet.players[1],
      ],
    });
    expect(decodeShare(bad)).toBeNull();
  });
});
