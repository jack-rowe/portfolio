import { NextRequest, NextResponse } from "next/server";
import { assembleLeague } from "@/lib/fantasy/league";
import { positionalRankChanges } from "@/lib/fantasy/impact";
import { lineupSlots, makeLineupEvaluator, type LineupSlot } from "@/lib/fantasy/lineup";
import type { Asset } from "@/lib/fantasy/values";

const PICK_GAIN_WEIGHT = 0.3;

const slim = (s: LineupSlot) => ({
  slot: s.slot,
  player: s.player
    ? {
        id: s.player.id,
        name: s.player.name,
        position: s.player.position,
        value: s.player.value,
        proj: s.player.proj,
      }
    : null,
});

interface Assignment {
  assetId: string;
  fromRosterId: number;
  toRosterId: number;
}

// Judge a hand-built multi-team trade: any set of asset movements between
// 2-3 rosters, each team's optimal lineup evaluated before/after.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const leagueId: string | undefined = body?.leagueId;
  const userId: string | undefined = body?.userId;
  const assignments: Assignment[] = Array.isArray(body?.assignments)
    ? body.assignments
        .map((a: Record<string, unknown>) => ({
          assetId: String(a?.assetId),
          fromRosterId: Number(a?.fromRosterId),
          toRosterId: Number(a?.toRosterId),
        }))
        .slice(0, 24)
    : [];

  if (!leagueId || !userId || assignments.length === 0) {
    return NextResponse.json(
      { error: "leagueId, userId and at least one asset movement required" },
      { status: 400 }
    );
  }

  const { league, teams } = await assembleLeague(leagueId);
  const positions = league.roster_positions;
  const involved = new Set<number>();
  for (const a of assignments) {
    involved.add(a.fromRosterId);
    involved.add(a.toRosterId);
  }
  if (involved.size < 2 || involved.size > 3) {
    return NextResponse.json(
      { error: "A trade involves 2 or 3 teams" },
      { status: 400 }
    );
  }

  const byRoster = new Map(teams.map((t) => [t.rosterId, t]));
  const moves: { asset: Asset; from: number; to: number }[] = [];
  for (const a of assignments) {
    const from = byRoster.get(a.fromRosterId);
    const asset = from?.assets.find((x) => x.id === a.assetId);
    if (!from || !asset || a.fromRosterId === a.toRosterId || !byRoster.has(a.toRosterId)) {
      return NextResponse.json(
        { error: "Invalid asset movement (roster changed?)" },
        { status: 409 }
      );
    }
    moves.push({ asset, from: a.fromRosterId, to: a.toRosterId });
  }

  const afterByRosterId = new Map<number, Asset[]>();
  const results = [...involved].map((rid) => {
    const team = byRoster.get(rid)!;
    const out = moves.filter((m) => m.from === rid).map((m) => m.asset);
    const incoming = moves.filter((m) => m.to === rid).map((m) => m.asset);
    const outIds = new Set(out.map((a) => a.id));
    const after = [...team.assets.filter((a) => !outIds.has(a.id)), ...incoming];
    afterByRosterId.set(rid, after);
    const ev = makeLineupEvaluator(team.assets, positions);
    const pickNet =
      incoming.filter((a) => a.isPick).reduce((s, a) => s + a.value, 0) -
      out.filter((a) => a.isPick).reduce((s, a) => s + a.value, 0);
    const gain = ev(outIds, incoming) - ev(new Set(), []) + PICK_GAIN_WEIGHT * pickNet;
    return { team, out, incoming, after, gain };
  });

  const ranks = positionalRankChanges(teams, positions, afterByRosterId);
  const isMe = (rid: number) => byRoster.get(rid)?.ownerUserId === userId;
  const payload = results
    .sort((a, b) => Number(isMe(b.team.rosterId)) - Number(isMe(a.team.rosterId)))
    .map((r) => ({
      rosterId: r.team.rosterId,
      ownerName: r.team.ownerName,
      owner: r.team.owner,
      isMe: isMe(r.team.rosterId),
      gain: Math.round(r.gain),
      sends: r.out.map((a) => ({ id: a.id, name: a.name, position: a.position, value: a.value, isPick: a.isPick })),
      receives: r.incoming.map((a) => ({ id: a.id, name: a.name, position: a.position, value: a.value, isPick: a.isPick })),
      lineups: {
        before: lineupSlots(r.team.assets, positions).map(slim),
        after: lineupSlots(r.after, positions).map(slim),
        ranks: ranks.get(r.team.rosterId) ?? [],
      },
    }));

  const losers = payload.filter((p) => p.gain <= 0);
  const verdict =
    losers.length === 0
      ? "Every team's starting lineup improves — this is a deal worth pitching to both managers."
      : `${losers.map((l) => l.ownerName).join(" and ")} ${losers.length === 1 ? "gets" : "get"} worse — expect a decline unless they value these players differently.`;

  const label = (a: { name: string; position: string; isPick: boolean }) =>
    `${a.name}${a.isPick ? "" : ` (${a.position})`}`;
  const clipboard = [
    `Trade proposal — ${league.name}${involved.size === 3 ? " (3-team)" : ""}`,
    ``,
    ...payload.map(
      (p) =>
        `${p.ownerName} sends: ${p.sends.map(label).join(", ") || "(nothing)"} · receives: ${p.receives.map(label).join(", ") || "(nothing)"}`
    ),
    ``,
    `Read: ${verdict}`,
  ].join("\n");

  return NextResponse.json({ teams: payload, verdict, clipboard });
}
