import { NextRequest, NextResponse } from "next/server";
import { assembleLeague } from "@/lib/fantasy/league";
import { lineupSlots, type LineupSlot } from "@/lib/fantasy/lineup";
import { positionalRankChanges } from "@/lib/fantasy/impact";
import { evaluateTrade, suggestAdds } from "@/lib/fantasy/trades";

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

// Score a hand-built trade (calculator) with the same math as the finder.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const leagueId: string | undefined = body?.leagueId;
  const userId: string | undefined = body?.userId;
  const myRosterId = Number(body?.myRosterId);
  const opponentRosterId = Number(body?.opponentRosterId);
  const sendIds: string[] = Array.isArray(body?.sendIds) ? body.sendIds.map(String) : [];
  const receiveIds: string[] = Array.isArray(body?.receiveIds)
    ? body.receiveIds.map(String)
    : [];

  if (
    !leagueId ||
    !Number.isFinite(opponentRosterId) ||
    (!userId && !Number.isFinite(myRosterId))
  ) {
    return NextResponse.json(
      { error: "leagueId, opponentRosterId, and userId (or myRosterId) required" },
      { status: 400 }
    );
  }
  if (!sendIds.length && !receiveIds.length) {
    return NextResponse.json({ error: "Pick at least one asset" }, { status: 400 });
  }

  const { league, teams } = await assembleLeague(leagueId);
  const myTeam = userId
    ? teams.find((t) => t.ownerUserId === userId)
    : teams.find((t) => t.rosterId === myRosterId);
  const opp = teams.find((t) => t.rosterId === opponentRosterId);
  if (!myTeam || !opp || myTeam === opp) {
    return NextResponse.json({ error: "Invalid rosters" }, { status: 400 });
  }

  const send = myTeam.assets.filter((a) => sendIds.includes(a.id));
  const receive = opp.assets.filter((a) => receiveIds.includes(a.id));
  if (send.length !== sendIds.length || receive.length !== receiveIds.length) {
    return NextResponse.json(
      { error: "Some selected assets are no longer on those rosters" },
      { status: 409 }
    );
  }

  const evaln = evaluateTrade(
    myTeam,
    opp,
    send,
    receive,
    league.roster_positions
  );

  const label = (a: { name: string; position: string; isPick: boolean }) =>
    `${a.name}${a.isPick ? "" : ` (${a.position})`}`;
  const clipboard = [
    `Trade proposal — ${league.name}`,
    ``,
    `${myTeam.ownerName} sends: ${send.map(label).join(", ") || "(nothing)"}`,
    `${opp.ownerName} sends: ${receive.map(label).join(", ") || "(nothing)"}`,
    ``,
    `Read: ${evaln.verdict}`,
  ].join("\n");

  // Before/after starter views for both rosters.
  const positions = league.roster_positions;
  const sendIdSet = new Set(sendIds);
  const receiveIdSet = new Set(receiveIds);
  const myAfter = [...myTeam.assets.filter((a) => !sendIdSet.has(a.id)), ...receive];
  const theirAfter = [...opp.assets.filter((a) => !receiveIdSet.has(a.id)), ...send];
  const ranks = positionalRankChanges(
    teams,
    positions,
    new Map([
      [myTeam.rosterId, myAfter],
      [opp.rosterId, theirAfter],
    ])
  );
  const lineups = {
    mine: {
      before: lineupSlots(myTeam.assets, positions).map(slim),
      after: lineupSlots(myAfter, positions).map(slim),
      ranks: ranks.get(myTeam.rosterId) ?? [],
    },
    theirs: {
      before: lineupSlots(opp.assets, positions).map(slim),
      after: lineupSlots(theirAfter, positions).map(slim),
      ranks: ranks.get(opp.rosterId) ?? [],
    },
  };

  const suggestions = suggestAdds(
    myTeam,
    opp,
    send,
    receive,
    league.roster_positions
  ).map((s) => ({
    asset: s.asset,
    side: s.side,
    myGain: s.evaluation.myGain,
    theirGain: s.evaluation.theirGain,
    sendDV: s.evaluation.sendDV,
    receiveDV: s.evaluation.receiveDV,
  }));

  return NextResponse.json({ ...evaln, clipboard, suggestions, lineups });
}
