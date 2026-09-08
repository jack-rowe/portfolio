import { NextRequest, NextResponse } from "next/server";
import { assembleLeague, type LeagueTeam } from "@/lib/fantasy/league";
import { lineupSlots, type LineupSlot } from "@/lib/fantasy/lineup";
import { getMatchups, getNflState, type SleeperMatchup } from "@/lib/fantasy/sleeper";
import { CORE_POSITIONS, type Asset } from "@/lib/fantasy/values";

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

// This week's matchup, compared by optimal-lineup market value.
export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId");
  const userId = req.nextUrl.searchParams.get("userId");
  if (!leagueId || !userId) {
    return NextResponse.json({ error: "leagueId and userId required" }, { status: 400 });
  }

  const state = await getNflState();
  if (state.season_type === "off" || state.season_type === "pre") {
    return NextResponse.json({ offseason: true, week: state.week });
  }
  const week = Math.min(18, Math.max(1, state.week || 1));

  const { league, teams } = await assembleLeague(leagueId);
  const me = teams.find((t) => t.ownerUserId === userId);
  if (!me) {
    return NextResponse.json(
      { error: "You don't have a roster in this league" },
      { status: 404 }
    );
  }

  const matchups = await getMatchups(leagueId, week);
  const mine = matchups.find((m) => m.roster_id === me.rosterId);
  if (!mine || mine.matchup_id == null) {
    return NextResponse.json({ noMatchup: true, week });
  }
  const theirs = matchups.find(
    (m) => m.matchup_id === mine.matchup_id && m.roster_id !== me.rosterId
  );
  const opp = theirs ? teams.find((t) => t.rosterId === theirs.roster_id) : null;
  if (!opp) {
    return NextResponse.json({ noMatchup: true, week });
  }

  const positions = league.roster_positions;
  const mySlots = lineupSlots(me.assets, positions);
  const oppSlots = lineupSlots(opp.assets, positions);
  const totalOf = (slots: LineupSlot[]) =>
    Math.round(slots.reduce((s, x) => s + (x.player?.value ?? 0), 0));

  // Positional edges, flex starters counted at their real position.
  const edges = CORE_POSITIONS.map((pos) => {
    const sum = (slots: LineupSlot[]) =>
      Math.round(
        slots
          .flatMap((s) => (s.player && s.player.position === pos ? [s.player] : []))
          .reduce((acc, p) => acc + p.value, 0)
      );
    const mineV = sum(mySlots);
    const theirsV = sum(oppSlots);
    return { pos, mine: mineV, theirs: theirsV, diff: mineV - theirsV };
  });

  // Start/sit audit: the lineup actually set in Sleeper vs the optimal one.
  const audit = (team: LeagueTeam, m: SleeperMatchup | undefined) => {
    const actualIds = (m?.starters ?? []).filter((id) => id && id !== "0");
    if (!actualIds.length) return null;
    const byId = new Map(team.assets.map((a) => [a.id, a]));
    const optimal = lineupSlots(team.assets, positions).flatMap((s) =>
      s.player ? [s.player] : []
    );
    const optimalIds = new Set(optimal.map((p) => p.id));
    const actual = actualIds
      .map((id) => byId.get(id))
      .filter((a): a is Asset => Boolean(a));
    const actualSet = new Set(actual.map((a) => a.id));
    const shouldStart = optimal.filter((p) => !actualSet.has(p.id));
    const brief = (a: Asset) => ({
      name: a.name,
      position: a.position,
      value: a.value,
      proj: a.proj,
    });
    if (!shouldStart.length) return { errors: [], valueDelta: 0, projDelta: 0 };
    const sitPool = actual.filter((a) => !optimalIds.has(a.id));
    const errors = shouldStart
      .sort((a, b) => b.value - a.value)
      .map((p) => {
        let idx = sitPool.findIndex((x) => x.position === p.position);
        if (idx < 0) idx = 0;
        const over = sitPool.splice(idx, 1)[0] ?? null;
        return { start: brief(p), over: over ? brief(over) : null };
      });
    const sum = (xs: Asset[], f: (a: Asset) => number) =>
      xs.reduce((s, a) => s + f(a), 0);
    return {
      errors,
      valueDelta: Math.round(sum(optimal, (a) => a.value) - sum(actual, (a) => a.value)),
      projDelta:
        Math.round(
          (sum(optimal, (a) => a.proj ?? 0) - sum(actual, (a) => a.proj ?? 0)) * 10
        ) / 10,
    };
  };

  return NextResponse.json({
    week,
    me: { owner: me.owner, ownerName: me.ownerName, slots: mySlots.map(slim), total: totalOf(mySlots) },
    opp: { owner: opp.owner, ownerName: opp.ownerName, slots: oppSlots.map(slim), total: totalOf(oppSlots) },
    edges,
    startSit: audit(me, mine),
    oppStartSit: theirs ? audit(opp, theirs) : null,
  });
}
