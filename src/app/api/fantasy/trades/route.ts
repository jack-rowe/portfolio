import { NextRequest, NextResponse } from "next/server";
import { assembleLeague, type LeagueTeam } from "@/lib/fantasy/league";
import { lineupSlots, type LineupSlot } from "@/lib/fantasy/lineup";
import { positionalRankChanges } from "@/lib/fantasy/impact";
import type { Asset } from "@/lib/fantasy/values";
import { CORE_POSITIONS, type CorePosition } from "@/lib/fantasy/values";
import {
  findStarTrades,
  findThreeTeamTrades,
  findTrades,
  normalizeSettings,
  proposalToClipboard,
  type TradeProposal,
} from "@/lib/fantasy/trades";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const leagueId: string | undefined = body?.leagueId;
  const userId: string | undefined = body?.userId;
  const targetPosition: string | undefined = body?.targetPosition;
  const targetTier: number = Number(body?.targetTier) || 1;
  const wantedIds: string[] = Array.isArray(body?.wantedIds)
    ? body.wantedIds.map(String).slice(0, 16)
    : [];
  const shipIds: string[] = Array.isArray(body?.shipIds)
    ? body.shipIds.map(String).slice(0, 16)
    : [];
  const pinnedExact: boolean = body?.pinnedExact === true;
  const opponentRosterId: number | null =
    body?.opponentRosterId != null && Number.isFinite(Number(body.opponentRosterId))
      ? Number(body.opponentRosterId)
      : null;
  const settings = normalizeSettings(body?.settings);
  if (opponentRosterId != null) {
    // Head-to-head: the per-team diversity cap shouldn't strangle a
    // single-opponent search.
    settings.maxPerTeam = Math.max(settings.maxPerTeam, settings.numResults);
  }

  if (!leagueId || !userId) {
    return NextResponse.json(
      { error: "leagueId and userId are required" },
      { status: 400 }
    );
  }
  if (
    settings.mode === "target" &&
    !CORE_POSITIONS.includes(targetPosition as CorePosition)
  ) {
    return NextResponse.json(
      { error: "targetPosition of QB/RB/WR/TE is required in target mode" },
      { status: 400 }
    );
  }
  if (settings.mode === "players" && wantedIds.length === 0 && shipIds.length === 0) {
    return NextResponse.json(
      { error: "wantedIds or shipIds is required in players mode" },
      { status: 400 }
    );
  }
  if (settings.mode === "players" && wantedIds.length === 0) {
    // Ship-only search behaves like a scan with a pinned send side.
    settings.mode = "scan";
  }

  const { league, teams, matchReport, nameByUserId } = await assembleLeague(leagueId);

  const myTeam = teams.find((t) => t.ownerUserId === userId);
  if (!myTeam) {
    return NextResponse.json(
      { error: "You don't have a roster in this league" },
      { status: 404 }
    );
  }
  let opponents = teams.filter((t) => t.rosterId !== myTeam.rosterId);
  if (opponentRosterId != null) {
    opponents = opponents.filter((t) => t.rosterId === opponentRosterId);
    if (!opponents.length) {
      return NextResponse.json(
        { error: "That roster isn't another team in this league" },
        { status: 400 }
      );
    }
  }

  const searchInput = {
    myTeam,
    opponents,
    rosterPositions: league.roster_positions,
    targetPosition: targetPosition as CorePosition | undefined,
    targetTier,
    wantedIds,
    shipIds,
    pinnedExact,
    settings,
  };
  // 'only' restricts find/scan/h2h results to 3-team deals exclusively.
  const skipTwoTeam = settings.mode !== "players" && settings.threeTeam === "only";
  const twoTeam = skipTwoTeam ? [] : findTrades(searchInput);

  // 3-team searches: automatic in players mode when the wanted players span
  // exactly two rosters; opt-in (allowThreeTeam) for target/scan/head-to-head.
  const allOpponents = teams.filter((t) => t.rosterId !== myTeam.rosterId);
  let triProposals: TradeProposal[] = [];
  if (settings.mode === "players") {
    const holders = new Set(
      allOpponents
        .filter((t) => t.assets.some((a) => wantedIds.includes(a.id)))
        .map((t) => t.rosterId)
    );
    if (holders.size === 2) {
      triProposals = findStarTrades({ ...searchInput, opponents: allOpponents });
    }
  } else if (settings.threeTeam !== "off") {
    triProposals = findThreeTeamTrades({
      ...searchInput,
      opponents: allOpponents,
      requiredRosterId: opponentRosterId ?? undefined,
    });
  }

  const proposals = [...twoTeam, ...triProposals]
    .sort(
      (a, b) =>
        b.myLineupGain + 0.3 * b.theirGain - (a.myLineupGain + 0.3 * a.theirGain)
    )
    .slice(0, settings.numResults);

  const myName = nameByUserId.get(userId) ?? "You";
  const ownerByRosterId = new Map(teams.map((t) => [t.rosterId, t.owner]));
  const teamByRosterId = new Map<number, LeagueTeam>(teams.map((t) => [t.rosterId, t]));

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
  const positions = league.roster_positions;
  // Before/after starter views for each proposal, both teams.
  const lineupsFor = (send: Asset[], receive: Asset[], opp: LeagueTeam) => {
    const sendIds = new Set(send.map((a) => a.id));
    const receiveIds = new Set(receive.map((a) => a.id));
    const myAfter = [...myTeam.assets.filter((a) => !sendIds.has(a.id)), ...receive];
    const theirAfter = [...opp.assets.filter((a) => !receiveIds.has(a.id)), ...send];
    const ranks = positionalRankChanges(
      teams,
      positions,
      new Map([
        [myTeam.rosterId, myAfter],
        [opp.rosterId, theirAfter],
      ])
    );
    return {
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
  };
  return NextResponse.json({
    league: { name: league.name },
    myTeam: { name: myName, owner: myTeam.owner, assets: myTeam.assets },
    proposals: proposals.map((p) => {
      const opp = teamByRosterId.get(p.targetRosterId);
      // 3-team deals get per-team before/after lineups (lineups3) instead of
      // the two-team pair.
      let lineups3 = null;
      if (p.via) {
        const parts = [
          { team: myTeam, out: p.send, incoming: p.receive },
          ...p.via.map((v) => ({
            team: teamByRosterId.get(v.rosterId)!,
            out: v.sends,
            incoming: v.receives,
          })),
        ];
        const afterMap = new Map<number, Asset[]>(
          parts.map((x) => {
            const outIds = new Set(x.out.map((a) => a.id));
            return [
              x.team.rosterId,
              [...x.team.assets.filter((a) => !outIds.has(a.id)), ...x.incoming],
            ];
          })
        );
        const ranks = positionalRankChanges(teams, positions, afterMap);
        lineups3 = parts.map((x) => ({
          rosterId: x.team.rosterId,
          ownerName: x.team.ownerName,
          owner: x.team.owner,
          isMe: x.team.rosterId === myTeam.rosterId,
          cmp: {
            before: lineupSlots(x.team.assets, positions).map(slim),
            after: lineupSlots(afterMap.get(x.team.rosterId)!, positions).map(slim),
            ranks: ranks.get(x.team.rosterId) ?? [],
          },
        }));
      }
      return {
        ...p,
        targetOwner: ownerByRosterId.get(p.targetRosterId) ?? null,
        lineups: !p.via && opp ? lineupsFor(p.send, p.receive, opp) : null,
        lineups3,
        clipboard: proposalToClipboard(p, league.name, myName),
      };
    }),
    matchReport,
  });
}
