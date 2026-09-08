import { NextRequest, NextResponse } from "next/server";
import { assembleLeague } from "@/lib/fantasy/league";
import { lineupSlots, starterIds } from "@/lib/fantasy/lineup";
import { CORE_POSITIONS, type CorePosition } from "@/lib/fantasy/values";

const AGE_CLIFF: Record<CorePosition, number> = { QB: 35, RB: 27, WR: 29, TE: 30 };

// Roster audit: droppable players, positional fragility, bye pileups,
// aging assets (dynasty), injury watch.
export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId");
  const userId = req.nextUrl.searchParams.get("userId");
  if (!leagueId || !userId) {
    return NextResponse.json({ error: "leagueId and userId required" }, { status: 400 });
  }

  const { league, format, teams, vl } = await assembleLeague(leagueId);
  const me = teams.find((t) => t.ownerUserId === userId);
  if (!me) {
    return NextResponse.json(
      { error: "You don't have a roster in this league" },
      { status: 404 }
    );
  }

  const positions = league.roster_positions;
  const starters = starterIds(me.assets, positions);
  const slots = lineupSlots(me.assets, positions);
  const players = me.assets.filter((a) => !a.isPick);
  const slim = (a: (typeof players)[number]) => ({
    id: a.id,
    name: a.name,
    position: a.position,
    value: a.value,
    age: a.age,
    injury: a.injury,
    bye: a.bye,
  });

  // Droppable: bench players far below replacement — dead roster spots.
  const cuts = players
    .filter((a) => !starters.has(a.id))
    .filter((a) => {
      const repl = vl.replacement[a.position as CorePosition] ?? 0;
      return a.value < Math.max(repl * 0.4, 120);
    })
    .sort((a, b) => a.value - b.value)
    .slice(0, 8)
    .map(slim);

  // Fragility: gap between your starters and the next man up per position.
  const fragility = CORE_POSITIONS.map((pos) => {
    const startersAtPos = slots
      .flatMap((s) => (s.player && s.player.position === pos ? [s.player] : []))
      .sort((a, b) => b.value - a.value);
    if (!startersAtPos.length) return null;
    const backup =
      players
        .filter((a) => a.position === pos && !starters.has(a.id))
        .sort((a, b) => b.value - a.value)[0] ?? null;
    const repl = vl.replacement[pos] ?? 0;
    const worstStarter = startersAtPos[startersAtPos.length - 1];
    const status = !backup
      ? "critical"
      : backup.value < repl * 0.6
        ? "thin"
        : "ok";
    return {
      pos,
      status,
      worstStarter: { name: worstStarter.name, value: worstStarter.value },
      backup: backup ? { name: backup.name, value: backup.value } : null,
      dropoff: Math.round(worstStarter.value - (backup?.value ?? 0)),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  // Bye pileups: weeks where 3+ of your optimal starters sit.
  const byeMap = new Map<number, string[]>();
  for (const s of slots) {
    if (s.player?.bye) {
      byeMap.set(s.player.bye, [...(byeMap.get(s.player.bye) ?? []), s.player.name]);
    }
  }
  const byes = [...byeMap.entries()]
    .filter(([, names]) => names.length >= 3)
    .sort((a, b) => a[0] - b[0])
    .map(([week, names]) => ({ week, players: names }));

  // Aging assets (dynasty): value at risk of decaying — move while it's there.
  const aging = format.isDynasty
    ? players
        .filter(
          (a) =>
            a.age != null &&
            a.age >= (AGE_CLIFF[a.position as CorePosition] ?? 99) &&
            a.value >= 300
        )
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
        .map(slim)
    : [];

  const injuries = players
    .filter((a) => a.injury && a.value >= 100)
    .sort((a, b) => b.value - a.value)
    .map(slim);

  return NextResponse.json({
    isDynasty: format.isDynasty,
    cuts,
    fragility,
    byes,
    aging,
    injuries,
  });
}
