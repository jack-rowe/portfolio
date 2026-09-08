import { NextRequest, NextResponse } from "next/server";
import { assembleLeague } from "@/lib/fantasy/league";
import { getTransactions } from "@/lib/fantasy/sleeper";
import { packageValue } from "@/lib/fantasy/trades";
import type { Asset } from "@/lib/fantasy/values";

const ord = (r: number) => (r === 1 ? "1st" : r === 2 ? "2nd" : r === 3 ? "3rd" : `${r}th`);

// Completed trades in the league, valued at TODAY's FantasyCalc prices.
export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId");
  if (!leagueId) {
    return NextResponse.json({ error: "leagueId required" }, { status: 400 });
  }

  const { teams, vl, pickValues, players } = await assembleLeague(leagueId);
  const teamByRosterId = new Map(teams.map((t) => [t.rosterId, t]));

  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
  const perWeek = await Promise.all(
    weeks.map((w) => getTransactions(leagueId, w).catch(() => []))
  );
  const trades = perWeek
    .flat()
    .filter((t) => t.type === "trade" && t.status === "complete")
    .sort((a, b) => b.created - a.created)
    .slice(0, 50);

  const valued = trades.map((t) => {
    const sides = t.roster_ids.map((rid) => {
      const team = teamByRosterId.get(rid);
      const received = [
        ...Object.entries(t.adds ?? {})
          .filter(([, r]) => r === rid)
          .map(([pid]) => {
            const fc = vl.valueBySleeperId.get(pid);
            const sp = players[pid];
            return {
              name:
                fc?.player.name ??
                sp?.full_name ??
                [sp?.first_name, sp?.last_name].filter(Boolean).join(" ") ??
                pid,
              position: sp?.position ?? "?",
              value: fc?.value ?? 0,
              isPick: false,
            };
          }),
        ...(t.draft_picks ?? [])
          .filter((p) => p.owner_id === rid)
          .map((p) => ({
            name: `${p.season} ${ord(p.round)}`,
            position: "PICK",
            value: pickValues.get(`${p.season}:${p.round}`) ?? 0,
            isPick: true,
          })),
      ];
      return {
        rosterId: rid,
        owner: team?.owner ?? null,
        ownerName: team?.ownerName ?? `Roster ${rid}`,
        received,
        total: Math.round(received.reduce((s, a) => s + a.value, 0)),
        dv: Math.round(packageValue(received as Asset[])),
      };
    });
    const max = Math.max(...sides.map((s) => s.total));
    const min = Math.min(...sides.map((s) => s.total));
    return {
      id: t.transaction_id,
      week: t.leg,
      date: t.status_updated ?? t.created,
      sides,
      winnerRosterId:
        max > min * 1.05 ? sides.find((s) => s.total === max)?.rosterId ?? null : null,
      spreadPct: max > 0 ? Math.round(((max - min) / max) * 100) : 0,
    };
  });

  // Manager market profile from 2-team trades: activity + net value moved.
  const stats = new Map<number, { trades: number; net: number }>();
  for (const t of valued) {
    if (t.sides.length !== 2) continue;
    const [a, b] = t.sides;
    for (const [side, other] of [
      [a, b],
      [b, a],
    ] as const) {
      const s = stats.get(side.rosterId) ?? { trades: 0, net: 0 };
      s.trades += 1;
      s.net += side.total - other.total;
      stats.set(side.rosterId, s);
    }
  }

  return NextResponse.json({
    trades: valued,
    managers: [...stats.entries()]
      .map(([rosterId, s]) => ({
        rosterId,
        owner: teamByRosterId.get(rosterId)?.owner ?? null,
        ownerName: teamByRosterId.get(rosterId)?.ownerName ?? `Roster ${rosterId}`,
        trades: s.trades,
        netValue: Math.round(s.net),
      }))
      .sort((x, y) => y.trades - x.trades),
    note: "Values are today's market prices, not prices at trade time.",
  });
}
