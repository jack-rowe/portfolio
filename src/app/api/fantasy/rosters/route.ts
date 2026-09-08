import { NextRequest, NextResponse } from "next/server";
import { assembleLeague } from "@/lib/fantasy/league";

// Full valued rosters for the trade calculator's pickers.
export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId");
  if (!leagueId) {
    return NextResponse.json({ error: "leagueId required" }, { status: 400 });
  }
  const { league, teams, matchReport } = await assembleLeague(leagueId);
  return NextResponse.json({
    league: { name: league.name },
    teams: teams.map((t) => ({
      rosterId: t.rosterId,
      ownerUserId: t.ownerUserId,
      ownerName: t.ownerName,
      owner: t.owner,
      assets: t.assets,
    })),
    matchReport,
  });
}
