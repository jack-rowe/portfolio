import { NextRequest, NextResponse } from "next/server";
import { assembleLeague } from "@/lib/fantasy/league";
import { getNflState, getProjections } from "@/lib/fantasy/sleeper";

// Projected points for a specific week, scored to the league's PPR setting,
// filtered to rostered players so the payload stays small.
export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId");
  const week = Number(req.nextUrl.searchParams.get("week"));
  if (!leagueId || !Number.isInteger(week) || week < 1 || week > 18) {
    return NextResponse.json(
      { error: "leagueId and week (1-18) required" },
      { status: 400 }
    );
  }

  const { format, teams } = await assembleLeague(leagueId);
  const state = await getNflState().catch(() => null);
  const season = state?.season ?? String(new Date().getFullYear());
  const key =
    format.ppr >= 1 ? "pts_ppr" : format.ppr >= 0.5 ? "pts_half_ppr" : "pts_std";

  const rostered = new Set(
    teams.flatMap((t) => t.assets.filter((a) => !a.isPick).map((a) => a.id))
  );
  const proj: Record<string, number> = {};
  try {
    const raw = await getProjections(season, week);
    for (const [pid, stats] of Object.entries(raw)) {
      if (!rostered.has(pid)) continue;
      const v = stats?.[key];
      if (typeof v === "number" && v > 0) proj[pid] = v;
    }
  } catch {
    /* no projections for that week — return empty map */
  }

  return NextResponse.json({ week, proj });
}
