import { NextRequest, NextResponse } from "next/server";
import { assembleLeague } from "@/lib/fantasy/league";
import { starterIds } from "@/lib/fantasy/lineup";

const TREND_MIN = 40; // ignore noise below this 30-day move

// Buy-low / sell-high board from FantasyCalc trend30Day.
export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId");
  const userId = req.nextUrl.searchParams.get("userId");
  if (!leagueId || !userId) {
    return NextResponse.json({ error: "leagueId and userId required" }, { status: 400 });
  }

  const { league, teams } = await assembleLeague(leagueId);
  const me = teams.find((t) => t.ownerUserId === userId);
  if (!me) {
    return NextResponse.json(
      { error: "You don't have a roster in this league" },
      { status: 404 }
    );
  }

  const mine = me.assets
    .filter((a) => !a.isPick && a.trend30Day != null && Math.abs(a.trend30Day) >= TREND_MIN)
    .sort((a, b) => Math.abs(b.trend30Day!) - Math.abs(a.trend30Day!))
    .slice(0, 14)
    .map((a) => ({
      id: a.id,
      name: a.name,
      position: a.position,
      value: a.value,
      trend: a.trend30Day!,
    }));

  const market = teams
    .filter((t) => t.rosterId !== me.rosterId)
    .flatMap((t) => {
      const starters = starterIds(t.assets, league.roster_positions);
      return t.assets
        .filter(
          (a) =>
            !a.isPick &&
            a.trend30Day != null &&
            a.value >= 300 &&
            // buy-low: real value bleeding; bench riser: rising but not started
            (a.trend30Day <= -TREND_MIN * 1.5 ||
              (a.trend30Day >= TREND_MIN * 1.5 && !starters.has(a.id)))
        )
        .map((a) => ({
          id: a.id,
          name: a.name,
          position: a.position,
          value: a.value,
          trend: a.trend30Day!,
          owner: t.owner,
          ownerName: t.ownerName,
          rosterId: t.rosterId,
          tag: a.trend30Day! < 0 ? ("buy low" as const) : ("bench riser" as const),
        }));
    })
    .sort((a, b) => Math.abs(b.trend) - Math.abs(a.trend))
    .slice(0, 20);

  return NextResponse.json({ mine, market });
}
