import { NextRequest, NextResponse } from "next/server";
import { getLeagues, getUser } from "@/lib/fantasy/sleeper";
import { formatFromLeague } from "@/lib/fantasy/fantasycalc";

function currentSeason(): string {
  const now = new Date();
  // NFL league year: before March, Sleeper leagues still live under last year.
  const year = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
  return String(year);
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }
  const user = await getUser(username);
  if (!user) {
    return NextResponse.json(
      { error: `No Sleeper user named "${username}"` },
      { status: 404 }
    );
  }
  const season = currentSeason();
  let leagues = await getLeagues(user.user_id, season);
  let usedSeason = season;
  if (!leagues?.length) {
    usedSeason = String(Number(season) - 1);
    leagues = await getLeagues(user.user_id, usedSeason);
  }
  return NextResponse.json({
    user: { user_id: user.user_id, display_name: user.display_name },
    season: usedSeason,
    leagues: (leagues ?? []).map((l) => {
      const f = formatFromLeague(l);
      return {
        league_id: l.league_id,
        name: l.name,
        season: l.season,
        total_rosters: l.total_rosters,
        format: `${f.numTeams}-team · ${f.numQbs === 2 ? "Superflex" : "1QB"} · ${
          f.ppr === 1 ? "PPR" : f.ppr === 0.5 ? "Half PPR" : "Standard"
        } · ${f.isDynasty ? "Dynasty" : "Redraft"}`,
      };
    }),
  });
}
