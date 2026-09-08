import { NextRequest, NextResponse } from "next/server";
import { assembleLeague } from "@/lib/fantasy/league";
import { lineupSlots } from "@/lib/fantasy/lineup";
import { CORE_POSITIONS } from "@/lib/fantasy/values";

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId");
  const userId = req.nextUrl.searchParams.get("userId");
  if (!leagueId || !userId) {
    return NextResponse.json({ error: "leagueId and userId required" }, { status: 400 });
  }

  const { league, format, teams, matchReport } = await assembleLeague(leagueId);
  const positions = league.roster_positions;

  const computed = teams.map((t) => {
    const slots = lineupSlots(t.assets, positions);
    const starters = slots.flatMap((s) => (s.player ? [s.player] : []));
    const starterIds = new Set(starters.map((p) => p.id));
    const players = t.assets.filter((a) => !a.isPick);
    const picks = t.assets.filter((a) => a.isPick);
    const posStarterValue: Record<string, number> = {};
    for (const pos of CORE_POSITIONS) {
      posStarterValue[pos] = starters
        .filter((p) => p.position === pos)
        .reduce((s, p) => s + p.value, 0);
    }
    return {
      team: t,
      slots,
      starterIds,
      lineupValue: starters.reduce((s, p) => s + p.value, 0),
      rosterValue: players.reduce((s, a) => s + a.value, 0),
      pickValue: picks.reduce((s, a) => s + a.value, 0),
      posStarterValue,
    };
  });

  const ranked = [...computed].sort((a, b) => b.lineupValue - a.lineupValue);
  const me = computed.find((c) => c.team.ownerUserId === userId);
  if (!me) {
    return NextResponse.json(
      { error: "You don't have a roster in this league" },
      { status: 404 }
    );
  }

  const n = computed.length;
  const tierCut = Math.max(1, Math.ceil(n * 0.25));

  // Per-position report: my starter value at the position vs the league,
  // ranked, labeled strength / solid / need by league quartile.
  const positionReport = CORE_POSITIONS.map((pos) => {
    const sorted = [...computed].sort(
      (a, b) => b.posStarterValue[pos] - a.posStarterValue[pos]
    );
    const rank = sorted.findIndex((c) => c === me) + 1;
    const avg =
      computed.reduce((s, c) => s + c.posStarterValue[pos], 0) / Math.max(1, n);
    const label = rank <= tierCut ? "strength" : rank > n - tierCut ? "need" : "solid";
    const starters = me.slots
      .flatMap((s) => (s.player && s.player.position === pos ? [s.player] : []))
      .map((p) => ({ id: p.id, name: p.name, value: p.value }));
    return {
      pos,
      rank,
      teams: n,
      myValue: Math.round(me.posStarterValue[pos]),
      leagueAvg: Math.round(avg),
      label,
      starters,
    };
  });

  // Trade bait: my most valuable assets outside the optimal lineup.
  const tradeBait = me.team.assets
    .filter((a) => a.isPick || !me.starterIds.has(a.id))
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      name: a.name,
      position: a.position,
      value: a.value,
      surplus: a.surplus,
      isPick: a.isPick,
    }));

  return NextResponse.json({
    league: { name: league.name, isDynasty: format.isDynasty },
    rankings: ranked.map((c, i) => ({
      rank: i + 1,
      rosterId: c.team.rosterId,
      owner: c.team.owner,
      ownerName: c.team.ownerName,
      lineupValue: Math.round(c.lineupValue),
      benchValue: Math.round(c.rosterValue - c.lineupValue),
      pickValue: Math.round(c.pickValue),
      isMe: c === me,
    })),
    positionReport,
    tradeBait,
    matchReport,
  });
}
