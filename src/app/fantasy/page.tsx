"use client";

import { useEffect, useState } from "react";

interface LeagueRow {
  league_id: string;
  name: string;
  season: string;
  format: string;
}

interface AssetDto {
  id: string;
  name: string;
  position: string;
  value: number;
  isPick: boolean;
  proj?: number | null;
}

/** " · 17.4p" — Sleeper projected points for the upcoming week, if known. */
const projTag = (proj: number | null | undefined) =>
  proj != null ? ` · ${proj.toFixed(1)}p` : "";

interface SlotDto {
  slot: string;
  player: {
    id: string;
    name: string;
    position: string;
    value: number;
    proj?: number | null;
  } | null;
}

interface PosRankDto {
  pos: string;
  before: number;
  after: number;
  teams: number;
}

interface LineupCompare {
  before: SlotDto[];
  after: SlotDto[];
  ranks?: PosRankDto[];
}

interface ViaLegDto {
  rosterId: number;
  teamName: string;
  receives: AssetDto[];
  sends: AssetDto[];
  gain: number;
}

interface TriLineupDto {
  rosterId: number;
  ownerName: string;
  owner: OwnerDto;
  isMe: boolean;
  cmp: LineupCompare;
}

interface ProposalDto {
  targetTeam: string;
  targetRosterId: number;
  targetOwner: OwnerDto | null;
  via?: ViaLegDto[] | null;
  lineups3?: TriLineupDto[] | null;
  lineups: { mine: LineupCompare; theirs: LineupCompare } | null;
  receive: AssetDto[];
  send: AssetDto[];
  myLineupGain: number;
  theirGain: number;
  packageValue: number;
  targetValue: number;
  why: string;
  clipboard: string;
}

interface TradeResults {
  league: { name: string };
  myTeam: { name: string; assets: AssetDto[] };
  proposals: ProposalDto[];
  matchReport: {
    matched: number;
    unmatched: { id: string; name: string; position: string }[];
  };
}

interface OwnerDto {
  displayName: string;
  teamName: string | null;
}

interface RosterTeam {
  rosterId: number;
  ownerUserId: string | null;
  ownerName: string;
  owner: OwnerDto;
  assets: AssetDto[];
}

interface AddSuggestionDto {
  asset: AssetDto;
  side: "send" | "receive";
  myGain: number;
  theirGain: number;
  sendDV: number;
  receiveDV: number;
}

interface EvalResult {
  myGain: number;
  theirGain: number;
  sendDV: number;
  receiveDV: number;
  sendRaw: number;
  receiveRaw: number;
  verdict: string;
  clipboard: string;
  suggestions: AddSuggestionDto[];
  lineups: { mine: LineupCompare; theirs: LineupCompare } | null;
}

interface DashRanking {
  rank: number;
  rosterId: number;
  owner: OwnerDto;
  ownerName: string;
  lineupValue: number;
  benchValue: number;
  pickValue: number;
  isMe: boolean;
}

interface DashPosition {
  pos: string;
  rank: number;
  teams: number;
  myValue: number;
  leagueAvg: number;
  label: "strength" | "solid" | "need";
  starters: { id: string; name: string; value: number }[];
}

interface DashBait {
  id: string;
  name: string;
  position: string;
  value: number;
  surplus: number;
  isPick: boolean;
}

interface DashData {
  league: { name: string; isDynasty: boolean };
  rankings: DashRanking[];
  positionReport: DashPosition[];
  tradeBait: DashBait[];
}

interface HistAsset {
  name: string;
  position: string;
  value: number;
  isPick: boolean;
}

interface HistSide {
  rosterId: number;
  owner: OwnerDto | null;
  ownerName: string;
  received: HistAsset[];
  total: number;
}

interface HistTrade {
  id: string;
  week: number;
  date: number;
  sides: HistSide[];
  winnerRosterId: number | null;
  spreadPct: number;
}

interface HistData {
  trades: HistTrade[];
  managers: {
    rosterId: number;
    owner: OwnerDto | null;
    ownerName: string;
    trades: number;
    netValue: number;
  }[];
  note: string;
}

interface MoverMine {
  id: string;
  name: string;
  position: string;
  value: number;
  trend: number;
}

interface MoverMarket extends MoverMine {
  owner: OwnerDto;
  ownerName: string;
  rosterId: number;
  tag: string;
}

interface MoversData {
  mine: MoverMine[];
  market: MoverMarket[];
}

interface MatchupSide {
  owner: OwnerDto;
  ownerName: string;
  slots: SlotDto[];
  total: number;
}

interface StartSitBrief {
  name: string;
  position: string;
  value: number;
  proj: number | null;
}

interface StartSitDto {
  errors: { start: StartSitBrief; over: StartSitBrief | null }[];
  valueDelta: number;
  projDelta: number;
}

interface MatchupData {
  offseason?: boolean;
  noMatchup?: boolean;
  week: number;
  me?: MatchupSide;
  opp?: MatchupSide;
  edges?: { pos: string; mine: number; theirs: number; diff: number }[];
  startSit?: StartSitDto | null;
  oppStartSit?: StartSitDto | null;
}

interface MultiTeamResult {
  rosterId: number;
  ownerName: string;
  owner: OwnerDto;
  isMe: boolean;
  gain: number;
  sends: AssetDto[];
  receives: AssetDto[];
  lineups: LineupCompare;
}

interface MultiEvalResult {
  teams: MultiTeamResult[];
  verdict: string;
  clipboard: string;
}

interface DoctorItem {
  id: string;
  name: string;
  position: string;
  value: number;
  age: number | null;
  injury: string | null;
  bye: number | null;
}

interface DoctorData {
  isDynasty: boolean;
  cuts: DoctorItem[];
  fragility: {
    pos: string;
    status: "critical" | "thin" | "ok";
    worstStarter: { name: string; value: number };
    backup: { name: string; value: number } | null;
    dropoff: number;
  }[];
  byes: { week: number; players: string[] }[];
  aging: DoctorItem[];
  injuries: DoctorItem[];
}

const POSITIONS = ["QB", "RB", "WR", "TE", "ANY"] as const;
const TIERS = [1, 2, 3] as const;

interface Settings {
  maxSend: number;
  maxReceive: number;
  exactSizes: boolean;
  threeTeam: "off" | "on" | "only";
  numResults: number;
  maxPerTeam: number;
  overpayCap: number;
  minTheirGain: number;
  includePicks: boolean;
}

const SAVED_KEY = "tradedesk.usernames";

const DEFAULTS: Settings = {
  maxSend: 3,
  maxReceive: 2,
  exactSizes: false,
  threeTeam: "off" as const,
  numResults: 12,
  maxPerTeam: 3,
  overpayCap: 1.25,
  minTheirGain: 25,
  includePicks: true,
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** The one way team identity is rendered: team name plus @username. */
function UserTag({ owner, fallback }: { owner?: OwnerDto | null; fallback?: string }) {
  if (!owner) return <span className="usertag">{fallback ?? "unknown"}</span>;
  return (
    <span className="usertag">
      <b>{owner.teamName ?? `@${owner.displayName}`}</b>
      {owner.teamName && <span className="uname">@{owner.displayName}</span>}
    </span>
  );
}

const SLOT_LABELS: Record<string, string> = {
  SUPER_FLEX: "SFLX",
  WRRBTE_FLEX: "FLEX",
  WRRB_FLEX: "W/R",
  REC_FLEX: "W/T",
};
const slotLabel = (s: string) => SLOT_LABELS[s] ?? s;

function PlayerCell({
  p,
  variant,
  wide,
}: {
  p: SlotDto["player"];
  variant?: "out" | "in";
  wide?: boolean;
}) {
  const cls = `lu-p${variant ? ` ${variant}` : ""}${wide ? " wide" : ""}`;
  if (!p) return <span className={cls}>—</span>;
  return (
    <span className={cls}>
      <span className="lu-name">{p.name}</span>
      <span className="lu-meta">
        {fmt(p.value)}
        {projTag(p.proj)}
      </span>
    </span>
  );
}

/** Slot-by-slot starters before → after, changed rows highlighted. */
function LineupDiff({ label, cmp }: { label: React.ReactNode; cmp: LineupCompare }) {
  const total = (slots: SlotDto[]) =>
    slots.reduce((s, x) => s + (x.player?.value ?? 0), 0);
  const projTotal = (slots: SlotDto[]) =>
    slots.reduce((s, x) => s + (x.player?.proj ?? 0), 0);
  const projBefore = projTotal(cmp.before);
  const projAfter = projTotal(cmp.after);
  const projDelta = projAfter - projBefore;
  const hasProj = projBefore > 0 || projAfter > 0;
  return (
    <div className="lu-side">
      <div className="lockhead">{label}</div>
      {cmp.before.map((b, i) => {
        const a = cmp.after[i];
        const changed = (b.player?.id ?? null) !== (a?.player?.id ?? null);
        return (
          <div className={`lu-row${changed ? " changed" : ""}`} key={i}>
            <span className="lu-slot">{slotLabel(b.slot)}</span>
            {changed ? (
              <>
                <PlayerCell p={b.player} variant="out" />
                <span className="lu-arrow">→</span>
                <PlayerCell p={a?.player ?? null} variant="in" />
              </>
            ) : (
              <PlayerCell p={b.player} wide />
            )}
          </div>
        );
      })}
      <div className="lu-row lu-total">
        <span className="lu-slot">TOT</span>
        <span className="lu-before">{fmt(total(cmp.before))}</span>
        <span className="lu-arrow">→</span>
        <span className="lu-after">{fmt(total(cmp.after))}</span>
      </div>
      {hasProj && (
        <div className="lu-row lu-total lu-proj">
          <span className="lu-slot" title="projected points this week">
            PROJ
          </span>
          <span className="lu-before">{projBefore.toFixed(1)}p</span>
          <span className="lu-arrow">→</span>
          <span className="lu-after">
            {projAfter.toFixed(1)}p{" "}
            <em className={projDelta >= 0 ? "t-up" : "t-down"}>
              ({projDelta >= 0 ? "+" : ""}
              {projDelta.toFixed(1)})
            </em>
          </span>
        </div>
      )}
      {cmp.ranks && cmp.ranks.length > 0 && (
        <div className="lu-ranks">
          {cmp.ranks.map((r) => {
            const moved = r.after !== r.before;
            const up = r.after < r.before; // rank 1 is best
            return (
              <span
                key={r.pos}
                className={`lu-rank${moved ? (up ? " up" : " down") : ""}`}
                title={`${r.pos} starters rank of ${r.teams} teams`}
              >
                {r.pos} #{r.before}
                {moved && (
                  <>
                    →#{r.after} {up ? "▲" : "▼"}
                  </>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Both teams' roster-change views plus a week selector: pick a week and the
 * projected points (per player and the PROJ totals) re-render for that week.
 * "current" uses the server-baked upcoming-week projections.
 */
function LineupPanels({
  panels,
  leagueId,
  stacked,
}: {
  panels: { key: string | number; label: React.ReactNode; cmp: LineupCompare }[];
  leagueId: string;
  stacked?: boolean;
}) {
  const [week, setWeek] = useState(0); // 0 = server default (upcoming week)
  const [maps, setMaps] = useState<Record<number, Record<string, number>>>({});
  const [projLoading, setProjLoading] = useState(false);

  async function pick(w: number) {
    setWeek(w);
    if (w === 0 || maps[w] || projLoading) return;
    setProjLoading(true);
    try {
      const res = await fetch(`/api/fantasy/projections?leagueId=${leagueId}&week=${w}`);
      const body = await res.json();
      if (res.ok) setMaps((m) => ({ ...m, [w]: body.proj ?? {} }));
    } catch {
      /* keep server-baked projections */
    } finally {
      setProjLoading(false);
    }
  }

  const map = week === 0 ? null : (maps[week] ?? null);
  const apply = (cmp: LineupCompare): LineupCompare =>
    !map
      ? cmp
      : {
          ...cmp,
          before: cmp.before.map((s) =>
            s.player
              ? { ...s, player: { ...s.player, proj: map[s.player.id] ?? null } }
              : s
          ),
          after: cmp.after.map((s) =>
            s.player
              ? { ...s, player: { ...s.player, proj: map[s.player.id] ?? null } }
              : s
          ),
        };

  return (
    <div>
      <div className="lu-weekbar">
        <span className="ll">projections for</span>
        <select
          className="userswap"
          value={week}
          onChange={(e) => pick(Number(e.target.value))}
        >
          <option value={0}>this week</option>
          {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>
              week {w}
            </option>
          ))}
        </select>
        {projLoading && <span className="spin" style={{ padding: 0 }}>loading</span>}
      </div>
      <div
        className={`lineup-cmp${stacked ? " stacked" : ""}${panels.length > 2 ? " tri" : ""}`}
      >
        {panels.map((p) => (
          <LineupDiff key={p.key} label={p.label} cmp={apply(p.cmp)} />
        ))}
      </div>
    </div>
  );
}

/**
 * 3-team proposal flow: one column per team showing exactly what that team
 * gets (and from whom) and gives (and to whom).
 */
function TriFlow({ p }: { p: ProposalDto }) {
  const legs = p.via ?? [];
  const fromOf = (a: AssetDto) =>
    legs.find((l) => l.sends.some((x) => x.id === a.id))?.teamName ?? "?";
  const toOfMine = (a: AssetDto) =>
    legs.find((l) => l.receives.some((x) => x.id === a.id))?.teamName ?? "?";
  const cols = [
    {
      key: "me",
      title: <b>you</b>,
      gain: p.myLineupGain,
      gets: p.receive.map((a) => ({ a, tag: fromOf(a) })),
      gives: p.send.map((a) => ({ a, tag: toOfMine(a) })),
    },
    ...legs.map((l) => ({
      key: String(l.rosterId),
      title: <b>{l.teamName}</b>,
      gain: l.gain,
      gets: l.receives.map((a) => ({
        a,
        tag: p.send.some((x) => x.id === a.id)
          ? "you"
          : (legs.find((o) => o !== l && o.sends.some((x) => x.id === a.id))
              ?.teamName ?? "?"),
      })),
      gives: l.sends.map((a) => ({
        a,
        tag: p.receive.some((x) => x.id === a.id)
          ? "you"
          : (legs.find((o) => o !== l && o.receives.some((x) => x.id === a.id))
              ?.teamName ?? "?"),
      })),
    })),
  ];
  return (
    <div className="triflow">
      {cols.map((c) => (
        <div className="tf-col" key={c.key}>
          <div className="tf-head">
            {c.title}
            <span className={`tf-gain${c.gain < 0 ? " neg" : ""}`}>
              {c.gain >= 0 ? "+" : ""}
              {fmt(c.gain)}
            </span>
          </div>
          <div className="tf-label">gets</div>
          {c.gets.map(({ a, tag }) => (
            <div className="tf-asset" key={a.id}>
              <Chip a={a} />
              <span className="tf-tag">← {tag}</span>
            </div>
          ))}
          <div className="tf-label">gives</div>
          {c.gives.map(({ a, tag }) => (
            <div className="tf-asset" key={a.id}>
              <Chip a={a} />
              <span className="tf-tag">→ {tag}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Plain-text variant for places that can't render markup (select options). */
function ownerText(owner?: OwnerDto | null, fallback?: string): string {
  if (!owner) return fallback ?? "unknown";
  return owner.teamName
    ? `${owner.teamName} — @${owner.displayName}`
    : `@${owner.displayName}`;
}

function Chip({ a }: { a: AssetDto }) {
  return (
    <span className="chip">
      {a.name}
      <span className="pos">{a.isPick ? "PICK" : a.position}</span>
      <span className="val" title="market value · projected points this week">
        {fmt(a.value)}
        {projTag(a.proj)}
      </span>
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={`copy${done ? " done" : ""}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? "copied ✓" : "copy proposal"}
    </button>
  );
}

function Seg<T extends string | number>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<string, string>;
}) {
  return (
    <span className="seg">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          className={o === value ? "on" : ""}
          onClick={() => onChange(o)}
        >
          {labels?.[String(o)] ?? String(o)}
        </button>
      ))}
    </span>
  );
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<{ user_id: string; display_name: string } | null>(null);
  const [leagues, setLeagues] = useState<LeagueRow[] | null>(null);
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [pos, setPos] = useState<(typeof POSITIONS)[number]>("WR");
  const [tier, setTier] = useState<number>(2);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [showOptions, setShowOptions] = useState(false);
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<TradeResults | null>(null);
  const [expandedLineup, setExpandedLineup] = useState<number | null>(null);
  const [loading, setLoading] = useState<null | "user" | "trades" | "rosters" | "eval">(null);
  const [error, setError] = useState<string | null>(null);

  // Saved usernames (localStorage) for quick swapping
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
      if (Array.isArray(raw)) setSaved(raw.filter((x) => typeof x === "string").slice(0, 8));
    } catch {
      /* storage unavailable */
    }
  }, []);
  function rememberUsername(name: string) {
    setSaved((prev) => {
      const next = [name, ...prev.filter((s) => s.toLowerCase() !== name.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  // Trade calculator state
  const [tab, setTab] = useState<
    "dash" | "find" | "wanted" | "h2h" | "calc" | "market" | "movers" | "matchup" | "doctor"
  >("dash");
  const [dash, setDash] = useState<DashData | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [hist, setHist] = useState<HistData | null>(null);
  const [movers, setMovers] = useState<MoversData | null>(null);
  const [matchup, setMatchup] = useState<MatchupData | null>(null);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [auxLoading, setAuxLoading] = useState<string | null>(null);
  const [wantedSel, setWantedSel] = useState<Set<string>>(new Set());
  const [shipSel, setShipSel] = useState<Set<string>>(new Set());
  const [pinnedExact, setPinnedExact] = useState(false);
  const [wantedFilter, setWantedFilter] = useState("");
  const [teams, setTeams] = useState<RosterTeam[] | null>(null);
  const [oppRosterId, setOppRosterId] = useState<number | null>(null);
  const [sendSel, setSendSel] = useState<Set<string>>(new Set());
  const [recvSel, setRecvSel] = useState<Set<string>>(new Set());
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [calcDrawer, setCalcDrawer] = useState(false);
  // 3-team calculator: optional third roster + asset destination assignments
  const [calcThird, setCalcThird] = useState<number | null>(null);
  const [multiAssign, setMultiAssign] = useState<Map<string, number>>(new Map());
  const [multiResult, setMultiResult] = useState<MultiEvalResult | null>(null);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  async function lookupUser(name?: string) {
    const uname = (name ?? username).trim();
    if (!uname || loading) return;
    setLoading("user");
    setError(null);
    try {
      const res = await fetch(`/api/fantasy/leagues?username=${encodeURIComponent(uname)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Lookup failed");
      setUser(body.user);
      setLeagues(body.leagues);
      rememberUsername(uname);
      if (!body.leagues.length) setError("That user has no leagues this season.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(null);
    }
  }

  function switchUser(name: string) {
    if (loading) return;
    reset("user");
    setUsername(name);
    lookupUser(name);
  }

  async function search(kind: "find" | "wanted" | "h2h" = "find", h2hRosterId?: number) {
    if (!user || !league || loading) return;
    setLoading("trades");
    setError(null);
    try {
      const scan = pos === "ANY";
      const mode =
        kind === "wanted" ? "players" : kind === "h2h" || scan ? "scan" : "target";
      const res = await fetch("/api/fantasy/trades", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leagueId: league.league_id,
          userId: user.user_id,
          targetPosition: mode === "target" ? pos : undefined,
          targetTier: tier,
          wantedIds: kind === "wanted" ? [...wantedSel] : undefined,
          shipIds: kind === "wanted" ? [...shipSel] : undefined,
          pinnedExact: kind === "wanted" ? pinnedExact : undefined,
          opponentRosterId:
            kind === "h2h" ? h2hRosterId ?? oppRosterId ?? undefined : undefined,
          settings: {
            ...settings,
            mode,
            untouchableIds: [...locked],
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Search failed");
      setResults(body);
      setExpandedLineup(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(null);
    }
  }

  async function loadDashboard() {
    if (!league || !user || dashLoading) return;
    setDashLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/fantasy/dashboard?leagueId=${league.league_id}&userId=${user.user_id}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to load dashboard");
      setDash(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setDashLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "dash" && league && user && !dash) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, league, user]);

  // Lazy per-tab data loads for the insight tabs.
  useEffect(() => {
    if (!league || !user || auxLoading) return;
    const q = `leagueId=${league.league_id}&userId=${user.user_id}`;
    const jobs: Partial<
      Record<string, { has: unknown; url: string; set: (d: never) => void }>
    > = {
      market: { has: hist, url: `/api/fantasy/history?leagueId=${league.league_id}`, set: setHist },
      movers: { has: movers, url: `/api/fantasy/movers?${q}`, set: setMovers },
      matchup: { has: matchup, url: `/api/fantasy/matchup?${q}`, set: setMatchup },
      doctor: { has: doctor, url: `/api/fantasy/doctor?${q}`, set: setDoctor },
    };
    const job = jobs[tab];
    if (!job || job.has) return;
    (async () => {
      setAuxLoading(tab);
      setError(null);
      try {
        const res = await fetch(job.url);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load");
        job.set(body as never);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setAuxLoading(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, league, user]);

  async function loadRosters() {
    if (!league || teams || loading) return;
    setLoading("rosters");
    setError(null);
    try {
      const res = await fetch(`/api/fantasy/rosters?leagueId=${league.league_id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to load rosters");
      setTeams(body.teams);
      const firstOpp = (body.teams as RosterTeam[]).find(
        (t) => t.ownerUserId !== user?.user_id
      );
      // Don't clobber an opponent already chosen (e.g. a proposal sent to the
      // calculator before rosters finished loading).
      setOppRosterId((prev) => prev ?? firstOpp?.rosterId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rosters");
    } finally {
      setLoading(null);
    }
  }

  async function evaluate(sendIds?: string[], receiveIds?: string[], oppId?: number) {
    const opponent = oppId ?? oppRosterId;
    if (!league || !user || opponent == null || loading === "eval") return;
    setLoading("eval");
    setError(null);
    try {
      const res = await fetch("/api/fantasy/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leagueId: league.league_id,
          userId: user.user_id,
          opponentRosterId: opponent,
          sendIds: sendIds ?? [...sendSel],
          receiveIds: receiveIds ?? [...recvSel],
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Evaluation failed");
      setEvalResult(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setLoading(null);
    }
  }

  const toggleSel =
    (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (id: string) => {
      setEvalResult(null);
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };
  const toggleSend = toggleSel(setSendSel);
  const toggleRecv = toggleSel(setRecvSel);

  const toggleMulti = (assetId: string, others: [number, number]) => {
    setMultiResult(null);
    setMultiAssign((prev) => {
      const next = new Map(prev);
      const cur = next.get(assetId);
      const [x, y] = others;
      if (cur == null) next.set(assetId, x);
      else if (cur === x) next.set(assetId, y);
      else next.delete(assetId);
      return next;
    });
  };

  async function evaluateMulti() {
    if (!league || !user || !teams || loading) return;
    const ownerOf = (assetId: string) =>
      teams.find((t) => t.assets.some((a) => a.id === assetId))?.rosterId;
    const assignments = [...multiAssign]
      .map(([assetId, toRosterId]) => ({
        assetId,
        fromRosterId: ownerOf(assetId),
        toRosterId,
      }))
      .filter((a) => a.fromRosterId != null);
    if (!assignments.length) return;
    setLoading("eval");
    setError(null);
    try {
      const res = await fetch("/api/fantasy/evaluate-multi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leagueId: league.league_id,
          userId: user.user_id,
          assignments,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Evaluation failed");
      setMultiResult(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setLoading(null);
    }
  }

  /** Load a proposal into the calculator, opened as a sidebar so the
   *  proposals stay on screen, and judge it immediately. */
  function openInCalc(p: ProposalDto) {
    const sendIds = p.send.map((a) => a.id);
    const recvIds = p.receive.map((a) => a.id);
    setOppRosterId(p.targetRosterId);
    setSendSel(new Set(sendIds));
    setRecvSel(new Set(recvIds));
    setEvalResult(null);
    setCalcDrawer(true);
    loadRosters(); // no-op if already loaded
    evaluate(sendIds, recvIds, p.targetRosterId);
  }

  function reset(to: "user" | "league") {
    setResults(null);
    setError(null);
    setLocked(new Set());
    setTab("dash");
    setDash(null);
    setHist(null);
    setMovers(null);
    setMatchup(null);
    setDoctor(null);
    setTeams(null);
    setOppRosterId(null);
    setWantedSel(new Set());
    setShipSel(new Set());
    setWantedFilter("");
    setSendSel(new Set());
    setRecvSel(new Set());
    setEvalResult(null);
    setCalcDrawer(false);
    setCalcThird(null);
    setMultiAssign(new Map());
    setMultiResult(null);
    if (to === "user") {
      setUser(null);
      setLeagues(null);
      setLeague(null);
    } else {
      setLeague(null);
    }
  }

  const renderProposals = (embedded: boolean) => {
    if (!results) return null;
    return (
      <div style={embedded ? undefined : { marginTop: 30 }}>
        <div className="results-head">
          <div className="step-label" style={{ margin: 0, flex: 1 }}>
            <span className="num">04</span> proposals
          </div>
          <span className="count">
            {results.proposals.length} deals where both lineups improve
          </span>
        </div>

        {results.proposals.length === 0 && (
          <div className="empty">
            No mutual-gain deals found with these settings. Loosen the overpay
            tolerance, lower their required gain, or try a different position or
            tier.
          </div>
        )}

        {results.proposals.map((p, i) => (
          <article className="proposal" key={i}>
            {p.via ? (
              <TriFlow p={p} />
            ) : (
            <div className="top">
              <div className="swap">
                <div className="side">
                  <span className="who">
                    {p.via ? (
                      <>you receive · 3-team deal</>
                    ) : (
                      <>
                        you receive · from{" "}
                        <UserTag owner={p.targetOwner} fallback={p.targetTeam} />
                      </>
                    )}
                  </span>
                  {p.receive.map((a) => (
                    <Chip key={a.id} a={a} />
                  ))}
                </div>
                <span className="arrow">⇄</span>
                <div className="side">
                  <span className="who">you send</span>
                  {p.send.map((a) => (
                    <Chip key={a.id} a={a} />
                  ))}
                </div>
              </div>
              <div className="gains">
                <div className="g">
                  <b>+{fmt(p.myLineupGain)}</b>
                  <span>your side</span>
                </div>
                <div className="g">
                  <b>+{fmt(p.theirGain)}</b>
                  <span>their side</span>
                </div>
              </div>
            </div>
            )}
            <p className="why">{p.why}</p>
            {(() => {
              const sendRaw = p.send.reduce((s, a) => s + a.value, 0);
              const recvRaw = p.receive.reduce((s, a) => s + a.value, 0);
              const net = recvRaw - sendRaw;
              const sendPct =
                sendRaw + recvRaw > 0 ? (sendRaw / (sendRaw + recvRaw)) * 100 : 50;
              return (
                <div className="ledger">
                  <div className="ledger-cols">
                    <div className="ledger-side">
                      <span className="ll">you send · raw</span>
                      <b>{fmt(sendRaw)}</b>
                      <em>adj {fmt(p.packageValue)}</em>
                    </div>
                    <div className={`ledger-net ${net >= 0 ? "up" : "down"}`}>
                      <b>
                        {net >= 0 ? "+" : ""}
                        {fmt(net)}
                      </b>
                      <span>raw net to you</span>
                    </div>
                    <div className="ledger-side right">
                      <span className="ll">you receive · raw</span>
                      <b>{fmt(recvRaw)}</b>
                      <em>adj {fmt(p.targetValue)}</em>
                    </div>
                  </div>
                  <div className="ledger-bar">
                    <span className="lb-send" style={{ width: `${sendPct}%` }} />
                    <span className="lb-recv" style={{ width: `${100 - sendPct}%` }} />
                  </div>
                </div>
              );
            })()}
            {expandedLineup === i && p.lineups3 && (
              <LineupPanels
                panels={p.lineups3.map((t) => ({
                  key: t.rosterId,
                  label: t.isMe ? (
                    "your starters"
                  ) : (
                    <>
                      <UserTag owner={t.owner} fallback={t.ownerName} />
                      &apos;s starters
                    </>
                  ),
                  cmp: t.cmp,
                }))}
                leagueId={league?.league_id ?? ""}
                stacked={embedded}
              />
            )}
            {expandedLineup === i && p.lineups && (
              <LineupPanels
                panels={[
                  { key: "me", label: "your starters", cmp: p.lineups.mine },
                  {
                    key: "them",
                    label: (
                      <>
                        <UserTag owner={p.targetOwner} fallback={p.targetTeam} />
                        &apos;s starters
                      </>
                    ),
                    cmp: p.lineups.theirs,
                  },
                ]}
                leagueId={league?.league_id ?? ""}
                stacked={embedded}
              />
            )}
            <div className="foot">
              <span className="pkgmath">
                adj = consolidation-adjusted package pricing
              </span>
              <span className="foot-btns">
                {!p.via && (
                  <button className="copy" onClick={() => openInCalc(p)}>
                    → calculator
                  </button>
                )}
                {(p.lineups || p.lineups3) && (
                  <button
                    className="copy"
                    onClick={() => setExpandedLineup(expandedLineup === i ? null : i)}
                  >
                    {expandedLineup === i ? "hide lineups ▴" : "lineup impact ▾"}
                  </button>
                )}
                <CopyButton text={p.clipboard} />
              </span>
            </div>
          </article>
        ))}

        <div className="report">
          value match: {results.matchReport.matched} players priced
          {results.matchReport.unmatched.length > 0 && (
            <span className="warn">
              {" "}
              · {results.matchReport.unmatched.length} unpriced (
              {results.matchReport.unmatched
                .slice(0, 6)
                .map((u) => u.name)
                .join(", ")}
              {results.matchReport.unmatched.length > 6 ? ", …" : ""}) — treated as 0, not hidden
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="wrap">
      <header className="masthead">
        <h1>
          Trade<span className="tick">▲</span>Desk
        </h1>
        <div className="mast-right">
          {saved.length > 0 && (
            <select
              className="userswap"
              value={user && saved.some((s) => s.toLowerCase() === username.trim().toLowerCase()) ? username.trim() : ""}
              onChange={(e) => {
                if (e.target.value) switchUser(e.target.value);
              }}
              disabled={loading !== null}
            >
              <option value="" disabled>
                switch user…
              </option>
              {saved.map((s) => (
                <option key={s} value={s}>
                  @{s}
                </option>
              ))}
            </select>
          )}
          <span className="sub">sleeper × fantasycalc</span>
        </div>
      </header>

      {!user && (
        <section className="landing">
          <div className="kicker">no login · read-only · sleeper leagues</div>
          <h2>
            Find the trade the <em>other manager</em> says yes to.
          </h2>
          <p className="lede">
            Type your Sleeper username. We read your league, price every roster
            with live market values, and only surface deals where both starting
            lineups improve.
          </p>
          <form
            className="userform"
            onSubmit={(e) => {
              e.preventDefault();
              lookupUser();
            }}
          >
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="sleeper username"
              autoFocus
              spellCheck={false}
            />
            <button className="primary" disabled={loading === "user"}>
              {loading === "user" ? "…" : "Scout"}
            </button>
          </form>
          {saved.length > 0 && (
            <div className="recent-users">
              {saved.map((s) => (
                <button key={s} className="crumb" onClick={() => switchUser(s)}>
                  @{s}
                </button>
              ))}
            </div>
          )}
          {error && <div className="error">{error}</div>}
        </section>
      )}

      {user && !league && leagues && (
        <section>
          <div className="step-label">
            <span className="num">02</span> pick a league — {user.display_name}
          </div>
          <div className="league-grid">
            {leagues.map((l) => (
              <button key={l.league_id} className="league-card" onClick={() => setLeague(l)}>
                <div className="lname">{l.name}</div>
                <div className="lformat">{l.format}</div>
              </button>
            ))}
          </div>
          {error && <div className="error">{error}</div>}
          <div className="meta-row">
            <button className="crumb" onClick={() => reset("user")}>
              ← different user
            </button>
          </div>
        </section>
      )}

      {user && league && (
        <section>
          <div className="step-label">
            <span className="num">03</span> {league.name}
          </div>

          <div className="tabs">
            <button
              className={tab === "dash" ? "on" : ""}
              onClick={() => setTab("dash")}
            >
              Dashboard
            </button>
            <button
              className={tab === "find" ? "on" : ""}
              onClick={() => {
                if (tab !== "find") setResults(null);
                setTab("find");
              }}
            >
              Find trades
            </button>
            <button
              className={tab === "wanted" ? "on" : ""}
              onClick={() => {
                if (tab !== "wanted") setResults(null);
                setTab("wanted");
                loadRosters();
              }}
            >
              Player deals
            </button>
            <button
              className={tab === "h2h" ? "on" : ""}
              onClick={() => {
                if (tab !== "h2h") setResults(null);
                setTab("h2h");
                loadRosters();
              }}
            >
              Head to head
            </button>
            <button className={tab === "market" ? "on" : ""} onClick={() => setTab("market")}>
              Market
            </button>
            <button className={tab === "movers" ? "on" : ""} onClick={() => setTab("movers")}>
              Movers
            </button>
            <button className={tab === "matchup" ? "on" : ""} onClick={() => setTab("matchup")}>
              Matchup
            </button>
            <button className={tab === "doctor" ? "on" : ""} onClick={() => setTab("doctor")}>
              Doctor
            </button>
            <button
              className={tab === "calc" ? "on" : ""}
              onClick={() => {
                setTab("calc");
                loadRosters();
              }}
            >
              Trade calculator
            </button>
          </div>

          {tab === "dash" && (
            <div className="dash">
              {dashLoading && <div className="spin">weighing the league</div>}
              {dash && (
                <>
                  <div className="lockhead">power rankings · by optimal lineup value</div>
                  <div className="rank-list">
                    {dash.rankings.map((r) => {
                      const max = dash.rankings[0]?.lineupValue || 1;
                      return (
                        <div className={`rank-row${r.isMe ? " me" : ""}`} key={r.rosterId}>
                          <span className="rank-num">{r.rank}</span>
                          <span className="rank-team">
                            <UserTag owner={r.owner} fallback={r.ownerName} />
                          </span>
                          <span className="rank-bar">
                            <span
                              className="rank-fill"
                              style={{ width: `${(r.lineupValue / max) * 100}%` }}
                            />
                          </span>
                          <span className="rank-vals">
                            {fmt(r.lineupValue)}
                            <em> · bench {fmt(r.benchValue)}</em>
                            {dash.league.isDynasty && <em> · picks {fmt(r.pickValue)}</em>}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="lockhead" style={{ marginTop: 26 }}>
                    your position report · tap a need to hunt upgrades
                  </div>
                  <div className="pos-grid">
                    {dash.positionReport.map((p) => (
                      <button
                        key={p.pos}
                        className={`pos-card ${p.label}`}
                        onClick={() => {
                          setPos(p.pos as (typeof POSITIONS)[number]);
                          setResults(null);
                          setTab("find");
                        }}
                      >
                        <div className="pos-top">
                          <span className="pos-name">{p.pos}</span>
                          <span className={`pos-label ${p.label}`}>{p.label}</span>
                        </div>
                        <div className="pos-rank">
                          #{p.rank} <em>of {p.teams}</em>
                        </div>
                        <div className="pos-vals">
                          {fmt(p.myValue)}{" "}
                          <em>
                            vs {fmt(p.leagueAvg)} avg (
                            {p.leagueAvg > 0
                              ? `${p.myValue >= p.leagueAvg ? "+" : ""}${Math.round(
                                  ((p.myValue - p.leagueAvg) / p.leagueAvg) * 100
                                )}%`
                              : "—"}
                            )
                          </em>
                        </div>
                        <div className="pos-starters">
                          {p.starters.length
                            ? p.starters.map((s) => s.name).join(" · ")
                            : "no startable player"}
                        </div>
                      </button>
                    ))}
                  </div>

                  {dash.tradeBait.length > 0 && (
                    <>
                      <div className="lockhead" style={{ marginTop: 26 }}>
                        trade bait · value sitting outside your starting lineup
                      </div>
                      <div className="lockchips">
                        {dash.tradeBait.map((b) => (
                          <span key={b.id} className="lockchip bait">
                            {b.name}
                            <span className="lv">
                              {b.isPick ? "PK" : b.position} · {fmt(b.value)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "market" && (
            <div className="dash">
              {auxLoading === "market" && <div className="spin">reading the league ledger</div>}
              {hist && (
                <>
                  {hist.managers.length > 0 && (
                    <>
                      <div className="lockhead">
                        manager profiles · net value from two-team trades (today&apos;s prices)
                      </div>
                      <div className="lockchips">
                        {hist.managers.map((m) => (
                          <span key={m.rosterId} className="lockchip bait">
                            <UserTag owner={m.owner} fallback={m.ownerName} />
                            <span className="lv">
                              {m.trades} trade{m.trades === 1 ? "" : "s"} · net{" "}
                              {m.netValue >= 0 ? "+" : ""}
                              {fmt(m.netValue)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="lockhead" style={{ marginTop: 22 }}>
                    completed trades · {hist.trades.length} shown · valued at today&apos;s prices
                  </div>
                  {hist.trades.length === 0 && (
                    <div className="empty">No completed trades in this league yet.</div>
                  )}
                  {hist.trades.map((t) => (
                    <article className="proposal" key={t.id}>
                      <div className="hist-meta">
                        week {t.week} · {new Date(t.date).toLocaleDateString()}
                        {t.winnerRosterId != null && ` · value spread ${t.spreadPct}%`}
                      </div>
                      <div className="hist-sides">
                        {t.sides.map((s) => (
                          <div className="side" key={s.rosterId}>
                            <span className="who">
                              <UserTag owner={s.owner} fallback={s.ownerName} /> received ·{" "}
                              {fmt(s.total)}
                              {t.winnerRosterId === s.rosterId && (
                                <span className="win"> ▲ value win</span>
                              )}
                            </span>
                            {s.received.map((a, i) => (
                              <Chip key={i} a={{ id: `${t.id}:${s.rosterId}:${i}`, ...a }} />
                            ))}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === "movers" && (
            <div className="dash">
              {auxLoading === "movers" && <div className="spin">reading the tape</div>}
              {movers && (
                <>
                  <div className="lockhead">your roster · 30-day market moves</div>
                  {movers.mine.length === 0 && (
                    <div className="empty">No meaningful moves on your roster this month.</div>
                  )}
                  <div className="lockchips">
                    {movers.mine.map((m) => (
                      <span key={m.id} className="lockchip bait">
                        {m.name}
                        <span className="lv">
                          {m.position} · {fmt(m.value)} ·{" "}
                          <em className={m.trend > 0 ? "t-up" : "t-down"}>
                            {m.trend > 0 ? "▲" : "▼"}
                            {fmt(Math.abs(m.trend))}
                          </em>
                        </span>
                      </span>
                    ))}
                  </div>
                  <div className="lockhead" style={{ marginTop: 22 }}>
                    around the league · tap to target the player
                  </div>
                  {movers.market.length === 0 && (
                    <div className="empty">No buy-low or bench-riser candidates right now.</div>
                  )}
                  <div className="lockchips">
                    {movers.market.map((m) => (
                      <button
                        key={m.id}
                        className="lockchip suggest"
                        onClick={() => {
                          setWantedSel(new Set([m.id]));
                          setResults(null);
                          setTab("wanted");
                          loadRosters();
                        }}
                      >
                        {m.name}
                        <span className="lv">
                          {m.position} · {fmt(m.value)} ·{" "}
                          <em className={m.trend > 0 ? "t-up" : "t-down"}>
                            {m.trend > 0 ? "▲" : "▼"}
                            {fmt(Math.abs(m.trend))}
                          </em>{" "}
                          · {m.tag} · {ownerText(m.owner, m.ownerName)}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "matchup" && (
            <div className="dash">
              {auxLoading === "matchup" && <div className="spin">pulling the schedule</div>}
              {matchup?.offseason && (
                <div className="empty">
                  It&apos;s the offseason — no matchup to plan for. The finder and market
                  tabs still work year-round.
                </div>
              )}
              {matchup?.noMatchup && !matchup.offseason && (
                <div className="empty">No head-to-head matchup found for week {matchup.week}.</div>
              )}
              {matchup?.me && matchup.opp && matchup.edges && (
                <>
                  <div className="lockhead">
                    week {matchup.week} · you vs{" "}
                    <UserTag owner={matchup.opp.owner} fallback={matchup.opp.ownerName} /> ·{" "}
                    {fmt(matchup.me.total)} — {fmt(matchup.opp.total)} by market value
                  </div>
                  {matchup.startSit && matchup.startSit.errors.length > 0 && (
                    <div className="startsit">
                      <div className="lockhead warnhead">
                        start/sit check · you&apos;re leaving −{fmt(matchup.startSit.valueDelta)}{" "}
                        value / −{matchup.startSit.projDelta.toFixed(1)}p on the bench
                      </div>
                      {matchup.startSit.errors.map((e, i) => (
                        <div className="hist-meta" key={i}>
                          start <b>{e.start.name}</b> ({e.start.position} ·{" "}
                          {fmt(e.start.value)}
                          {projTag(e.start.proj)})
                          {e.over ? (
                            <>
                              {" "}
                              over {e.over.name} ({e.over.position} · {fmt(e.over.value)}
                              {projTag(e.over.proj)})
                            </>
                          ) : (
                            <> — that slot is currently empty</>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {matchup.startSit && matchup.startSit.errors.length === 0 && (
                    <div className="hist-meta oklabel">
                      ✓ your set lineup matches the optimal one
                    </div>
                  )}
                  {matchup.oppStartSit && matchup.oppStartSit.errors.length > 0 && (
                    <div className="hist-meta">
                      intel: {matchup.opp.ownerName} is misstarting — leaving{" "}
                      {fmt(matchup.oppStartSit.valueDelta)} value on their bench.
                    </div>
                  )}
                  <div className="lockchips" style={{ margin: "8px 0 16px" }}>
                    {matchup.edges.map((e) => (
                      <button
                        key={e.pos}
                        className={`lockchip${e.diff < 0 ? " losing" : " bait"}`}
                        onClick={
                          e.diff < 0
                            ? () => {
                                setPos(e.pos as (typeof POSITIONS)[number]);
                                setResults(null);
                                setTab("find");
                              }
                            : undefined
                        }
                      >
                        {e.pos}
                        <span className="lv">
                          {e.diff >= 0 ? "+" : ""}
                          {fmt(e.diff)}
                          {e.diff < 0 ? " · fix it →" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="lineup-cmp">
                    {[
                      { side: matchup.me, label: "your optimal lineup" },
                      {
                        side: matchup.opp,
                        label: (
                          <>
                            <UserTag owner={matchup.opp.owner} fallback={matchup.opp.ownerName} />
                            &apos;s optimal lineup
                          </>
                        ),
                      },
                    ].map(({ side, label }, i) => (
                      <div className="lu-side" key={i}>
                        <div className="lockhead">{label}</div>
                        {side.slots.map((s, j) => (
                          <div className="lu-row" key={j}>
                            <span className="lu-slot">{slotLabel(s.slot)}</span>
                            <PlayerCell p={s.player} wide />
                          </div>
                        ))}
                        <div className="lu-row lu-total">
                          <span className="lu-slot">TOT</span>
                          <span className="lu-before">{fmt(side.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "doctor" && (
            <div className="dash">
              {auxLoading === "doctor" && <div className="spin">running the physical</div>}
              {doctor && (
                <>
                  <div className="lockhead">positional depth · starter-to-backup dropoff</div>
                  <div className="pos-grid">
                    {doctor.fragility.map((f) => (
                      <div key={f.pos} className="pos-card static">
                        <div className="pos-top">
                          <span className="pos-name">{f.pos}</span>
                          <span
                            className={`pos-label ${
                              f.status === "ok" ? "strength" : f.status === "thin" ? "" : "need"
                            }`}
                          >
                            {f.status === "ok" ? "covered" : f.status}
                          </span>
                        </div>
                        <div className="pos-vals">
                          next man up:{" "}
                          {f.backup ? `${f.backup.name} (${fmt(f.backup.value)})` : "nobody"}
                        </div>
                        <div className="pos-starters">
                          dropoff from {f.worstStarter.name}: −{fmt(f.dropoff)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {doctor.injuries.length > 0 && (
                    <>
                      <div className="lockhead" style={{ marginTop: 22 }}>
                        injury watch
                      </div>
                      <div className="lockchips">
                        {doctor.injuries.map((d) => (
                          <span key={d.id} className="lockchip losing">
                            {d.name}
                            <span className="lv">
                              {d.position} · {fmt(d.value)} · {d.injury}
                            </span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {doctor.byes.length > 0 && (
                    <>
                      <div className="lockhead" style={{ marginTop: 22 }}>
                        bye-week pileups · 3+ starters out
                      </div>
                      {doctor.byes.map((b) => (
                        <div key={b.week} className="hist-meta">
                          week {b.week}: {b.players.join(", ")}
                        </div>
                      ))}
                    </>
                  )}

                  {doctor.aging.length > 0 && (
                    <>
                      <div className="lockhead" style={{ marginTop: 22 }}>
                        aging assets · value at risk (dynasty)
                      </div>
                      <div className="lockchips">
                        {doctor.aging.map((d) => (
                          <span key={d.id} className="lockchip bait">
                            {d.name}
                            <span className="lv">
                              {d.position} · {fmt(d.value)} · age {d.age != null ? Math.floor(d.age) : "?"}
                            </span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="lockhead" style={{ marginTop: 22 }}>
                    droppable · bench spots below replacement level
                  </div>
                  {doctor.cuts.length === 0 && (
                    <div className="empty">No dead weight — every bench spot carries value.</div>
                  )}
                  <div className="lockchips">
                    {doctor.cuts.map((d) => (
                      <span key={d.id} className="lockchip bait">
                        {d.name}
                        <span className="lv">
                          {d.position} · {fmt(d.value)}
                        </span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "find" && (
          <>
          <div className="target-row">
            <span>I want a</span>
            <Seg options={POSITIONS} value={pos} onChange={setPos} labels={{ ANY: "Any" }} />
            {pos !== "ANY" && <Seg options={TIERS} value={tier} onChange={setTier} />}
            <button
              className="primary go"
              onClick={() => search()}
              disabled={loading === "trades"}
            >
              {loading === "trades" ? "scouting…" : "Find trades"}
            </button>
          </div>
          </>
          )}

          {tab === "wanted" && (
            <div className="deal-split">
            <div className="wanted deal-left">
              {loading === "rosters" && <div className="spin">loading rosters</div>}
              {teams && (
                <>
                  <div className="wanted-head">
                    <input
                      className="filter"
                      placeholder="filter players…"
                      value={wantedFilter}
                      onChange={(e) => setWantedFilter(e.target.value)}
                      spellCheck={false}
                    />
                    <button
                      className="primary go"
                      onClick={() => search("wanted")}
                      disabled={
                        (wantedSel.size === 0 && shipSel.size === 0) ||
                        loading === "trades"
                      }
                    >
                      {loading === "trades"
                        ? "scouting…"
                        : `Find trades${
                            wantedSel.size || shipSel.size
                              ? ` (${[
                                  wantedSel.size ? `${wantedSel.size} target` : "",
                                  shipSel.size ? `${shipSel.size} shipped` : "",
                                ]
                                  .filter(Boolean)
                                  .join(", ")})`
                              : ""
                          }`}
                    </button>
                  </div>
                  <div className="opt" style={{ margin: "4px 0 12px" }}>
                    <label>Selected players are</label>
                    <Seg
                      options={["the whole deal", "core + extras"]}
                      value={pinnedExact ? "the whole deal" : "core + extras"}
                      onChange={(v) => setPinnedExact(v === "the whole deal")}
                    />
                  </div>
                  <p className="hint">
                    Two dials, use either or both: <b>ship</b> players from your roster
                    that every deal must send away, and <b>target</b> players you want
                    from other rosters. Ship-only finds the best return for the players
                    you&apos;re moving; target-only builds packages their manager should
                    accept; together, deals must include both. Targets from different
                    teams get separate deals per team.
                  </p>
                  {(() => {
                    const me = teams.find((t) => t.ownerUserId === user.user_id);
                    if (!me) return null;
                    return (
                      <div className="wanted-team ship">
                        <div className="lockhead">
                          ship from your roster
                          {shipSel.size > 0 && ` · ${shipSel.size} selected`}
                        </div>
                        <div className="lockchips">
                          {me.assets
                            .filter((a) => a.value > 0)
                            .map((a) => (
                              <button
                                key={a.id}
                                className={`lockchip${shipSel.has(a.id) ? " shipping" : ""}`}
                                onClick={() =>
                                  setShipSel((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(a.id)) next.delete(a.id);
                                    else next.add(a.id);
                                    return next;
                                  })
                                }
                              >
                                {a.name}
                                <span className="lv">
                                  {a.isPick ? "PK" : a.position} · {fmt(a.value)}
                                  {projTag(a.proj)}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="lockhead" style={{ marginBottom: 8 }}>
                    target from other rosters
                    {wantedSel.size > 0 && ` · ${wantedSel.size} selected`}
                  </div>
                  {teams
                    .filter((t) => t.ownerUserId !== user.user_id)
                    .map((t) => {
                      const filter = wantedFilter.trim().toLowerCase();
                      const shown = t.assets.filter(
                        (a) =>
                          a.value > 0 &&
                          (!filter || a.name.toLowerCase().includes(filter))
                      );
                      if (!shown.length) return null;
                      return (
                        <div className="wanted-team" key={t.rosterId}>
                          <div className="lockhead">
                            <UserTag owner={t.owner} fallback={t.ownerName} />
                          </div>
                          <div className="lockchips">
                            {shown.map((a) => (
                              <button
                                key={a.id}
                                className={`lockchip${wantedSel.has(a.id) ? " picked" : ""}`}
                                onClick={() =>
                                  setWantedSel((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(a.id)) next.delete(a.id);
                                    else next.add(a.id);
                                    return next;
                                  })
                                }
                              >
                                {a.name}
                                <span className="lv">
                                  {a.isPick ? "PK" : a.position} · {fmt(a.value)}
                                  {projTag(a.proj)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </>
              )}
            </div>
            <aside className="deal-right">
              {loading === "trades" ? (
                <div className="spin">reading rosters · pricing the market · solving lineups</div>
              ) : results ? (
                renderProposals(true)
              ) : (
                <div className="empty deal-placeholder">
                  Proposals land here — select players and hit Find trades.
                </div>
              )}
            </aside>
            </div>
          )}

          {tab === "h2h" && (
            <div className="wanted">
              {loading === "rosters" && <div className="spin">loading rosters</div>}
              {teams &&
                (() => {
                  const opps = teams.filter((t) => t.ownerUserId !== user.user_id);
                  const opp =
                    opps.find((t) => t.rosterId === oppRosterId) ?? opps[0];
                  if (!opp)
                    return <div className="empty">No other teams found here.</div>;
                  return (
                    <>
                      <div className="wanted-head">
                        <select
                          className="userswap"
                          value={opp.rosterId}
                          onChange={(e) => setOppRosterId(Number(e.target.value))}
                        >
                          {opps.map((t) => (
                            <option key={t.rosterId} value={t.rosterId}>
                              {ownerText(t.owner, t.ownerName)}
                            </option>
                          ))}
                        </select>
                        <button
                          className="primary go"
                          onClick={() => {
                            setOppRosterId(opp.rosterId);
                            search("h2h", opp.rosterId);
                          }}
                          disabled={loading === "trades"}
                        >
                          {loading === "trades" ? "scouting…" : "Find mutual trades"}
                        </button>
                      </div>
                      <p className="hint">
                        Scans every deal between your roster and{" "}
                        <UserTag owner={opp.owner} fallback={opp.ownerName} /> — no
                        target position, any shape within your settings. Only trades
                        where both starting lineups improve are shown.
                      </p>
                    </>
                  );
                })()}
            </div>
          )}

          {(tab === "find" || tab === "wanted" || tab === "h2h") && (
          <>
          <button className="crumb tune" onClick={() => setShowOptions((v) => !v)}>
            {showOptions ? "▾" : "▸"} tune the search
          </button>

          {showOptions && (
            <div className="options">
              <div className="opt">
                <label>3-team trades</label>
                <Seg
                  options={["off", "on", "only"] as const}
                  value={settings.threeTeam}
                  onChange={(v) => set("threeTeam", v)}
                />
              </div>
              <div className="opt">
                <label>Package sizes are</label>
                <Seg
                  options={["up to", "exactly"]}
                  value={settings.exactSizes ? "exactly" : "up to"}
                  onChange={(v) => set("exactSizes", v === "exactly")}
                />
              </div>
              <div className="opt">
                <label>You send {settings.exactSizes ? "exactly" : "up to"}</label>
                <Seg options={[1, 2, 3, 4]} value={settings.maxSend} onChange={(v) => set("maxSend", v)} />
              </div>
              <div className="opt">
                <label>You receive {settings.exactSizes ? "exactly" : "up to"}</label>
                <Seg options={[1, 2, 3, 4]} value={settings.maxReceive} onChange={(v) => set("maxReceive", v)} />
              </div>
              <div className="opt">
                <label>Deals to show</label>
                <Seg options={[6, 12, 20, 30]} value={settings.numResults} onChange={(v) => set("numResults", v)} />
              </div>
              <div className="opt">
                <label>Max per opponent</label>
                <Seg options={[1, 2, 3, 5]} value={settings.maxPerTeam} onChange={(v) => set("maxPerTeam", v)} />
              </div>
              <div className="opt">
                <label>Overpay tolerance</label>
                <Seg
                  options={[1.1, 1.25, 1.45]}
                  value={settings.overpayCap}
                  onChange={(v) => set("overpayCap", v)}
                  labels={{ "1.1": "strict", "1.25": "fair", "1.45": "aggressive" }}
                />
              </div>
              <div className="opt">
                <label>Their gain must be</label>
                <Seg
                  options={[0, 25, 100, 250]}
                  value={settings.minTheirGain}
                  onChange={(v) => set("minTheirGain", v)}
                  labels={{ "0": "any", "25": "real", "100": "clear", "250": "slam dunk" }}
                />
              </div>
              <div className="opt">
                <label>Draft picks</label>
                <Seg
                  options={["on", "off"]}
                  value={settings.includePicks ? "on" : "off"}
                  onChange={(v) => set("includePicks", v === "on")}
                />
              </div>
            </div>
          )}

          {results && results.myTeam.assets.length > 0 && (
            <div className="lockstrip">
              <div className="lockhead">
                your assets — tap to lock out of trades{locked.size > 0 && ` (${locked.size} locked)`}
              </div>
              <div className="lockchips">
                {results.myTeam.assets
                  .filter((a) => a.value > 0)
                  .map((a) => (
                    <button
                      key={a.id}
                      className={`lockchip${locked.has(a.id) ? " locked" : ""}`}
                      onClick={() =>
                        setLocked((prev) => {
                          const next = new Set(prev);
                          if (next.has(a.id)) next.delete(a.id);
                          else next.add(a.id);
                          return next;
                        })
                      }
                    >
                      {locked.has(a.id) ? "🔒 " : ""}
                      {a.name}
                      <span className="lv">
                        {fmt(a.value)}
                        {projTag(a.proj)}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          </>
          )}

          {(tab === "calc" || calcDrawer) && (
            <div className={`calc${calcDrawer && tab !== "calc" ? " drawer" : ""}`}>
              {calcDrawer && tab !== "calc" && (
                <div className="drawer-head">
                  <span className="lockhead" style={{ margin: 0 }}>
                    trade calculator
                  </span>
                  <button className="crumb" onClick={() => setCalcDrawer(false)}>
                    close ×
                  </button>
                </div>
              )}
              {loading === "rosters" && <div className="spin">loading rosters</div>}
              {teams && (
                (() => {
                  const me = teams.find((t) => t.ownerUserId === user.user_id);
                  const opps = teams.filter((t) => t !== me);
                  const opp = opps.find((t) => t.rosterId === oppRosterId) ?? opps[0];
                  if (!me || !opp)
                    return <div className="empty">Couldn&apos;t find your roster here.</div>;
                  const sendAssets = me.assets.filter((a) => sendSel.has(a.id));
                  const recvAssets = opp.assets.filter((a) => recvSel.has(a.id));
                  const sum = (xs: AssetDto[]) => xs.reduce((s, a) => s + a.value, 0);
                  const third =
                    calcThird != null
                      ? (opps.find(
                          (t) => t.rosterId === calcThird && t.rosterId !== opp.rosterId
                        ) ?? null)
                      : null;
                  const shortName = (rid: number) =>
                    rid === me.rosterId
                      ? "you"
                      : (teams.find((t) => t.rosterId === rid)?.ownerName ?? "?");
                  return (
                    <>
                      <div className="calc-opp">
                        <label>trade with</label>
                        <select
                          value={opp.rosterId}
                          onChange={(e) => {
                            setOppRosterId(Number(e.target.value));
                            setRecvSel(new Set());
                            setEvalResult(null);
                            setMultiAssign(new Map());
                            setMultiResult(null);
                          }}
                        >
                          {opps.map((t) => (
                            <option key={t.rosterId} value={t.rosterId}>
                              {ownerText(t.owner, t.ownerName)}
                            </option>
                          ))}
                        </select>
                        <label>third team</label>
                        <select
                          value={third?.rosterId ?? ""}
                          onChange={(e) => {
                            setCalcThird(e.target.value ? Number(e.target.value) : null);
                            setMultiAssign(new Map());
                            setMultiResult(null);
                            setEvalResult(null);
                          }}
                        >
                          <option value="">none (2-team)</option>
                          {opps
                            .filter((t) => t.rosterId !== opp.rosterId)
                            .map((t) => (
                              <option key={t.rosterId} value={t.rosterId}>
                                {ownerText(t.owner, t.ownerName)}
                              </option>
                            ))}
                        </select>
                      </div>

                      {third && (
                        <>
                          <p className="hint">
                            3-team mode: tap an asset to cycle where it goes — each tap
                            switches its destination between the other two teams, a third
                            tap keeps it put.
                          </p>
                          <div className="calc-grid tri">
                            {[me, opp, third].map((team) => {
                              const others = [me, opp, third!]
                                .filter((t) => t.rosterId !== team.rosterId)
                                .map((t) => t.rosterId) as [number, number];
                              return (
                                <div className="calc-side" key={team.rosterId}>
                                  <div className="lockhead">
                                    {team.rosterId === me.rosterId ? (
                                      "your roster"
                                    ) : (
                                      <UserTag owner={team.owner} fallback={team.ownerName} />
                                    )}
                                  </div>
                                  <div className="lockchips">
                                    {team.assets
                                      .filter((a) => a.value > 0)
                                      .map((a) => {
                                        const dest = multiAssign.get(a.id);
                                        return (
                                          <button
                                            key={a.id}
                                            className={`lockchip${dest != null ? " picked" : ""}`}
                                            onClick={() => toggleMulti(a.id, others)}
                                          >
                                            {a.name}
                                            <span className="lv">
                                              {a.isPick ? "PK" : a.position} · {fmt(a.value)}
                                              {projTag(a.proj)}
                                              {dest != null && (
                                                <b className="dest"> → {shortName(dest)}</b>
                                              )}
                                            </span>
                                          </button>
                                        );
                                      })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="calc-actions">
                            <button
                              className="primary go"
                              onClick={evaluateMulti}
                              disabled={loading === "eval" || multiAssign.size === 0}
                            >
                              {loading === "eval" ? "judging…" : "Judge this trade"}
                            </button>
                          </div>
                          {multiResult && (
                            <article className="proposal calcresult">
                              <div className="top">
                                <div className="gains">
                                  {multiResult.teams.map((t) => (
                                    <div className="g" key={t.rosterId}>
                                      <b className={t.gain < 0 ? "neg" : ""}>
                                        {t.gain >= 0 ? "+" : ""}
                                        {fmt(t.gain)}
                                      </b>
                                      <span>{t.isMe ? "your side" : t.ownerName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <p className="why">{multiResult.verdict}</p>
                              <LineupPanels
                                panels={multiResult.teams.map((t) => ({
                                  key: t.rosterId,
                                  label: t.isMe ? (
                                    "your starters"
                                  ) : (
                                    <>
                                      <UserTag owner={t.owner} fallback={t.ownerName} />
                                      &apos;s starters
                                    </>
                                  ),
                                  cmp: t.lineups,
                                }))}
                                leagueId={league?.league_id ?? ""}
                                stacked={calcDrawer && tab !== "calc"}
                              />
                              <div className="foot">
                                <span />
                                <CopyButton text={multiResult.clipboard} />
                              </div>
                            </article>
                          )}
                        </>
                      )}

                      {!third && (
                      <>
                      <div className="calc-grid">
                        {[
                          {
                            team: me,
                            sel: sendSel,
                            toggle: toggleSend,
                            label: <>you send</>,
                            picked: sendAssets,
                          },
                          {
                            team: opp,
                            sel: recvSel,
                            toggle: toggleRecv,
                            label: (
                              <>
                                you receive · <UserTag owner={opp.owner} fallback={opp.ownerName} />
                              </>
                            ),
                            picked: recvAssets,
                          },
                        ].map(({ team, sel, toggle, label, picked }) => (
                          <div className="calc-side" key={team.rosterId}>
                            <div className="lockhead">
                              {label} · {fmt(sum(picked))}
                            </div>
                            <div className="lockchips">
                              {team.assets
                                .filter((a) => a.value > 0)
                                .map((a) => (
                                  <button
                                    key={a.id}
                                    className={`lockchip${sel.has(a.id) ? " picked" : ""}`}
                                    onClick={() => toggle(a.id)}
                                  >
                                    {a.name}
                                    <span className="lv">
                                      {a.isPick ? "PK" : a.position} · {fmt(a.value)}
                                  {projTag(a.proj)}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="calc-actions">
                        <button
                          className="primary go"
                          onClick={() => evaluate()}
                          disabled={
                            loading === "eval" || (sendSel.size === 0 && recvSel.size === 0)
                          }
                        >
                          {loading === "eval" ? "judging…" : "Judge this trade"}
                        </button>
                      </div>
                      {evalResult && (
                        <article className="proposal calcresult">
                          <div className="top">
                            <div className="gains">
                              <div className="g">
                                <b className={evalResult.myGain < 0 ? "neg" : ""}>
                                  {evalResult.myGain >= 0 ? "+" : ""}
                                  {fmt(evalResult.myGain)}
                                </b>
                                <span>your side</span>
                              </div>
                              <div className="g">
                                <b className={evalResult.theirGain < 0 ? "neg" : ""}>
                                  {evalResult.theirGain >= 0 ? "+" : ""}
                                  {fmt(evalResult.theirGain)}
                                </b>
                                <span>their side</span>
                              </div>
                            </div>
                            <span className="pkgmath">
                              you pay {fmt(evalResult.sendDV)} for {fmt(evalResult.receiveDV)}{" "}
                              (consolidation-adjusted; raw {fmt(evalResult.sendRaw)} / {fmt(evalResult.receiveRaw)})
                            </span>
                          </div>
                          <p className="why">{evalResult.verdict}</p>
                          {evalResult.lineups && (
                            <LineupPanels
                              panels={[
                                {
                                  key: "me",
                                  label: "your starters",
                                  cmp: evalResult.lineups.mine,
                                },
                                {
                                  key: "them",
                                  label: (
                                    <>
                                      <UserTag owner={opp.owner} fallback={opp.ownerName} />
                                      &apos;s starters
                                    </>
                                  ),
                                  cmp: evalResult.lineups.theirs,
                                },
                              ]}
                              leagueId={league?.league_id ?? ""}
                              stacked={calcDrawer && tab !== "calc"}
                            />
                          )}
                          {evalResult.suggestions.length > 0 && (
                            <div className="suggests">
                              <div className="lockhead">
                                suggested add from{" "}
                                {evalResult.suggestions[0].side === "send" ? (
                                  "your side"
                                ) : (
                                  <>
                                    <UserTag owner={opp.owner} fallback={opp.ownerName} />
                                    &apos;s side
                                  </>
                                )}{" "}
                                to balance it
                              </div>
                              <div className="lockchips">
                                {evalResult.suggestions.map((s) => (
                                  <button
                                    key={s.asset.id}
                                    className="lockchip suggest"
                                    onClick={() => {
                                      const nextSend = new Set(sendSel);
                                      const nextRecv = new Set(recvSel);
                                      (s.side === "send" ? nextSend : nextRecv).add(
                                        s.asset.id
                                      );
                                      setSendSel(nextSend);
                                      setRecvSel(nextRecv);
                                      evaluate([...nextSend], [...nextRecv]);
                                    }}
                                  >
                                    + {s.asset.name}
                                    <span className="lv">
                                      {s.asset.isPick ? "PK" : s.asset.position} ·{" "}
                                      {fmt(s.asset.value)} → you{" "}
                                      {s.myGain >= 0 ? "+" : ""}
                                      {fmt(s.myGain)} / them{" "}
                                      {s.theirGain >= 0 ? "+" : ""}
                                      {fmt(s.theirGain)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="foot">
                            <span />
                            <CopyButton text={evalResult.clipboard} />
                          </div>
                        </article>
                      )}
                      </>
                      )}
                    </>
                  );
                })()
              )}
            </div>
          )}

          {loading === "trades" && tab !== "wanted" && (
            <div className="spin">reading rosters · pricing the market · solving lineups</div>
          )}
          {error && <div className="error">{error}</div>}

          {(tab === "find" || tab === "h2h") &&
            loading !== "trades" &&
            renderProposals(false)}

          <div className="meta-row">
            <button className="crumb" onClick={() => reset("league")}>
              ← different league
            </button>
            <button className="crumb" onClick={() => reset("user")}>
              ← different user
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
