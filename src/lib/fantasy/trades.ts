import { makeLineupEvaluator, starterIds } from "./lineup";
import type { Asset, CorePosition } from "./values";

// ---------------------------------------------------------------------------
// Settings â€” every knob the UI exposes, with clamped defaults.
// ---------------------------------------------------------------------------

export interface TradeSettings {
  /** Max players/picks you give up (1â€“4). */
  maxSend: number;
  /** Max players/picks you get back (1â€“4). */
  maxReceive: number;
  /**
   * When true, maxSend/maxReceive become exact counts â€” force a 2-for-1,
   * 3-for-2, 1-for-2 etc. shape instead of "up to".
   */
  exactSizes: boolean;
  /** How many proposals to return overall. */
  numResults: number;
  /** Diversity cap: max proposals per opposing team. */
  maxPerTeam: number;
  /**
   * Fairness window, as multipliers of the discounted value of what you
   * receive. You must pay at least `fairFloor`Ã— (nobody accepts a lowball) and
   * at most `overpayCap`Ã— (don't torch your roster for a small upgrade).
   */
  fairFloor: number;
  overpayCap: number;
  /** Your minimum lineup gain for a deal to count (filters churn). */
  minMyGain: number;
  /** Acceptance strictness: their minimum gain. Higher = fewer, easier sells. */
  minTheirGain: number;
  /** Trade future draft picks (dynasty only has pick values anyway). */
  includePicks: boolean;
  /** Player/pick ids you refuse to move. */
  untouchableIds: string[];
  /**
   * 'target' = upgrade a specific slot; 'scan' = any mutual-gain deal;
   * 'players' = build deals for specific wanted players (wantedIds on input).
   */
  mode: "target" | "scan" | "players";
  /**
   * 3-team trade search: 'off' = two-team only; 'on' = mix both;
   * 'only' = return exclusively 3-team deals (all three lineups must improve).
   */
  threeTeam: "off" | "on" | "only";
}

export const DEFAULT_SETTINGS: TradeSettings = {
  maxSend: 3,
  maxReceive: 2,
  exactSizes: false,
  numResults: 12,
  maxPerTeam: 3,
  fairFloor: 0.92,
  overpayCap: 1.25,
  minMyGain: 25,
  minTheirGain: 25,
  includePicks: true,
  untouchableIds: [],
  mode: "target",
  threeTeam: "off",
};

const clamp = (v: unknown, lo: number, hi: number, dflt: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

export function normalizeSettings(
  raw: Partial<TradeSettings> | null | undefined,
): TradeSettings {
  const d = DEFAULT_SETTINGS;
  return {
    maxSend: clamp(raw?.maxSend, 1, 4, d.maxSend),
    maxReceive: clamp(raw?.maxReceive, 1, 4, d.maxReceive),
    exactSizes: raw?.exactSizes === true,
    numResults: clamp(raw?.numResults, 1, 30, d.numResults),
    maxPerTeam: clamp(raw?.maxPerTeam, 1, 10, d.maxPerTeam),
    fairFloor: clamp(raw?.fairFloor, 0.7, 1.0, d.fairFloor),
    overpayCap: clamp(raw?.overpayCap, 1.0, 1.6, d.overpayCap),
    minMyGain: clamp(raw?.minMyGain, 0, 1000, d.minMyGain),
    minTheirGain: clamp(raw?.minTheirGain, 0, 1000, d.minTheirGain),
    includePicks: raw?.includePicks !== false,
    untouchableIds: Array.isArray(raw?.untouchableIds)
      ? raw!.untouchableIds.map(String).slice(0, 64)
      : [],
    mode:
      raw?.mode === "scan"
        ? "scan"
        : raw?.mode === "players"
          ? "players"
          : "target",
    threeTeam:
      raw?.threeTeam === "on" || raw?.threeTeam === "only" ? raw.threeTeam : "off",
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamState {
  rosterId: number;
  ownerName: string;
  assets: Asset[]; // players + picks, valued
}

export interface ViaLeg {
  rosterId: number;
  teamName: string;
  receives: Asset[];
  sends: Asset[];
  gain: number;
}

export interface TradeProposal {
  targetTeam: string;
  targetRosterId: number;
  receive: Asset[];
  send: Asset[];
  myLineupGain: number; // includes pick credit
  theirGain: number; // includes pick credit (3-team: the minimum other gain)
  packageValue: number; // consolidation-discounted value of what you send
  targetValue: number; // consolidation-discounted value of what you receive
  why: string;
  /** Present on 3-team deals: the other two teams' legs. */
  via?: ViaLeg[];
}

export interface TradeSearchInput {
  myTeam: TeamState;
  opponents: TeamState[];
  rosterPositions: string[];
  targetPosition?: CorePosition; // required in 'target' mode
  targetTier?: number; // "I want a WR2" => 2
  wantedIds?: string[]; // 'players' mode: assets you're after (their side)
  shipIds?: string[]; // assets of yours every package must include (any mode)
  /**
   * When true, pinned selections ARE the package â€” no extra pieces are added
   * to a side that has pins. Sides without pins still enumerate freely.
   */
  pinnedExact?: boolean;
  settings: TradeSettings;
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

// Consolidation discount: the receiving team has to cut players to make room,
// so two 2,000s are not one 4,000. Applied to every package, both directions.
const PACKAGE_WEIGHTS = [1.0, 0.85, 0.7, 0.6];

// Picks don't start, so lineup deltas ignore them. This credits a slice of
// net pick value moved so rebuild/contend trades still register as gains.
const PICK_GAIN_WEIGHT = 0.3;

export function packageValue(assets: readonly Asset[]): number {
  return assets
    .map((a) => a.value)
    .sort((a, b) => b - a)
    .reduce((sum, v, i) => sum + v * (PACKAGE_WEIGHTS[i] ?? 0.5), 0);
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// ---------------------------------------------------------------------------
// Subset enumeration
// ---------------------------------------------------------------------------

interface Pkg {
  assets: Asset[];
  dv: number; // discounted value
  raw: number; // raw sum
  pickValue: number; // raw value of pick pieces
  best: Asset; // highest-value piece
}

const POOL_CAP = 15; // top-N tradeable assets considered per side
const POOL_CAP_DEEP = 50; // single-opponent searches can afford a deeper pool

function buildPackages(pool: Asset[], maxSize: number, cap = POOL_CAP): Pkg[] {
  const sorted = pool
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, cap);
  const out: Pkg[] = [];
  const current: Asset[] = [];
  const walk = (start: number) => {
    if (current.length > 0) {
      const assets = [...current];
      out.push({
        assets,
        dv: packageValue(assets),
        raw: assets.reduce((s, a) => s + a.value, 0),
        pickValue: assets
          .filter((a) => a.isPick)
          .reduce((s, a) => s + a.value, 0),
        best: assets[0], // current is filled in descending-value order
      });
    }
    if (current.length === maxSize) return;
    for (let i = start; i < sorted.length; i++) {
      current.push(sorted[i]);
      walk(i + 1);
      current.pop();
    }
  };
  walk(0);
  return out;
}

/**
 * Packages that must contain every `required` asset, padded with 0..k extras
 * from the rest of the roster (throw-ins that sweeten or round out the deal).
 * If the user pinned more assets than maxSize allows, the pinned set still
 * forms one package on its own.
 */
function buildPackagesRequired(
  required: Asset[],
  extrasPool: Asset[],
  maxSize: number,
  cap = POOL_CAP,
): Pkg[] {
  const room = Math.max(0, maxSize - required.length);
  const toPkg = (assets: Asset[]): Pkg => {
    const sorted = [...assets].sort((a, b) => b.value - a.value);
    return {
      assets: sorted,
      dv: packageValue(sorted),
      raw: sorted.reduce((s, a) => s + a.value, 0),
      pickValue: sorted
        .filter((a) => a.isPick)
        .reduce((s, a) => s + a.value, 0),
      best: sorted[0],
    };
  };
  const out: Pkg[] = [toPkg(required)];
  if (room > 0) {
    for (const extra of buildPackages(extrasPool, room, cap)) {
      out.push(toPkg([...required, ...extra.assets]));
    }
  }
  return out;
}

/** Binary search: first index in dv-ascending `arr` with dv >= lo. */
function lowerBound(arr: Pkg[], lo: number): number {
  let l = 0;
  let r = arr.length;
  while (l < r) {
    const m = (l + r) >> 1;
    if (arr[m].dv < lo) l = m + 1;
    else r = m;
  }
  return l;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

// Hard budget of exact lineup evaluations, split across opponents. A
// single-opponent (head-to-head) search gets the whole budget, so it digs far
// past the top-of-roster packages into flex-tier deals.
const TOTAL_EVAL_BUDGET = 60000;
const MIN_BUDGET_PER_OPPONENT = 8000;

function stripScore(p: TradeProposal & { _score: number }): TradeProposal {
  const copy: TradeProposal & { _score?: number } = { ...p };
  delete copy._score;
  return copy;
}

export function findTrades(input: TradeSearchInput): TradeProposal[] {
  const { myTeam, opponents, rosterPositions, settings } = input;
  const targetPosition =
    settings.mode === "target" ? input.targetPosition : undefined;
  const targetTier = Math.max(1, Math.min(5, input.targetTier ?? 1));

  // ---- interpret the target ("I want a WR2") ----
  let targetLo = 0;
  let targetHi = Infinity;
  let currentHolder: Asset | null = null;
  if (targetPosition) {
    const myAtPos = myTeam.assets
      .filter((a) => a.position === targetPosition)
      .sort((a, b) => b.value - a.value);
    currentHolder = myAtPos[targetTier - 1] ?? null;
    const floor = currentHolder?.value ?? 0;
    // Must beat my current guy meaningfully; ceiling keeps proposals realistic
    // rather than a list of untouchable studs.
    targetLo = Math.max(floor * 1.12, floor + 150, 150);
    targetHi = currentHolder ? Math.max(floor * 3.2, 3000) : Infinity;
  }

  const untouchable = new Set(settings.untouchableIds);

  // ---- my side: tradeable pool and packages, priced once ----
  const myPool = myTeam.assets.filter(
    (a) => !untouchable.has(a.id) && (settings.includePicks || !a.isPick),
  );
  const ship = new Set(input.shipIds ?? []);
  // An explicit "ship this player" wins over an untouchable lock.
  const shipRequired = myTeam.assets.filter((a) => ship.has(a.id));
  const pinnedExact = input.pinnedExact === true;
  const deep = opponents.length === 1;
  const poolCap = deep ? POOL_CAP_DEEP : POOL_CAP;
  let myPackages: Pkg[];
  if (shipRequired.length) {
    myPackages = buildPackagesRequired(
      shipRequired,
      pinnedExact ? [] : myPool.filter((a) => !ship.has(a.id)),
      settings.maxSend,
      poolCap,
    );
    if (settings.exactSizes && !pinnedExact) {
      const exact = myPackages.filter(
        (p) => p.assets.length === settings.maxSend,
      );
      myPackages = exact.length ? exact : myPackages.slice(0, 1);
    }
  } else {
    myPackages = buildPackages(myPool, settings.maxSend, poolCap);
    if (settings.exactSizes) {
      myPackages = myPackages.filter(
        (p) => p.assets.length === settings.maxSend,
      );
    }
  }
  myPackages.sort((a, b) => a.dv - b.dv);

  const evalBudget = Math.max(
    MIN_BUDGET_PER_OPPONENT,
    Math.floor(TOTAL_EVAL_BUDGET / Math.max(1, opponents.length)),
  );
  const myEval = makeLineupEvaluator(myTeam.assets, rosterPositions);
  const myBase = myEval(new Set(), []);

  const proposals: (TradeProposal & { _score: number })[] = [];

  for (const opp of opponents) {
    const theirEval = makeLineupEvaluator(opp.assets, rosterPositions);
    const theirBase = theirEval(new Set(), []);
    const theirStarters = starterIds(opp.assets, rosterPositions);

    const theirPool = opp.assets.filter(
      (a) => settings.includePicks || !a.isPick,
    );
    let theirPackages: Pkg[];
    if (settings.mode === "players") {
      // Wanted-players mode: every package must contain this roster's wanted
      // assets; extras from the same roster can pad it out.
      const wanted = new Set(input.wantedIds ?? []);
      const required = opp.assets.filter((a) => wanted.has(a.id));
      if (required.length === 0) continue; // nobody I want on this roster
      theirPackages = buildPackagesRequired(
        required,
        pinnedExact ? [] : theirPool.filter((a) => !wanted.has(a.id)),
        settings.maxReceive,
      );
      if (settings.exactSizes && !pinnedExact) {
        // Keep only the forced shape; if the pinned players alone exceed it,
        // fall back to the pinned-only package rather than returning nothing.
        const exact = theirPackages.filter(
          (p) => p.assets.length === settings.maxReceive,
        );
        theirPackages = exact.length ? exact : theirPackages.slice(0, 1);
      }
    } else {
      theirPackages = buildPackages(theirPool, settings.maxReceive, poolCap);
      if (settings.exactSizes) {
        theirPackages = theirPackages.filter(
          (p) => p.assets.length === settings.maxReceive,
        );
      }
      // Target mode: the package must be headlined by a player at the target
      // position inside the band. Throw-in pieces can be anything.
      if (targetPosition) {
        theirPackages = theirPackages.filter(
          (p) =>
            p.best.position === targetPosition &&
            !p.best.isPick &&
            p.best.value >= targetLo &&
            p.best.value <= targetHi,
        );
      }
    }

    // Best proposal per distinct receive-set on this roster.
    const bestByReceive = new Map<string, TradeProposal & { _score: number }>();
    let evals = 0;
    // Spread the budget across ALL receive packages instead of letting the
    // first (highest-value) ones consume it â€” otherwise flex-tier deals at the
    // back of the enumeration never get evaluated.
    const perPackageCap = Math.max(
      40,
      Math.ceil(evalBudget / Math.max(1, theirPackages.length)),
    );

    for (const R of theirPackages) {
      if (evals >= evalBudget) break;
      let pkgEvals = 0;

      // Fairness window: what I send must be worth [fairFloor, overpayCap]Ã—
      // the discounted value of what I receive.
      const lo = R.dv * settings.fairFloor;
      const hi = R.dv * settings.overpayCap;
      const start = lowerBound(myPackages, lo);

      for (let i = start; i < myPackages.length; i++) {
        const S = myPackages[i];
        if (S.dv > hi) break;
        if (evals >= evalBudget || pkgEvals >= perPackageCap) break;
        evals++;
        pkgEvals++;

        // Pointless churn guard in target mode: don't ship out a same-position
        // player as good as the headliner I'm acquiring.
        if (
          targetPosition &&
          S.assets.some(
            (a) =>
              a.position === targetPosition && a.value >= R.best.value * 0.95,
          )
        )
          continue;

        const sendIds = new Set(S.assets.map((a) => a.id));
        const receiveIds = new Set(R.assets.map((a) => a.id));

        // ---- mutual gain, not fairness: both optimal lineups must improve ----
        const myLineupDelta = myEval(sendIds, R.assets) - myBase;
        const myGain =
          myLineupDelta + PICK_GAIN_WEIGHT * (R.pickValue - S.pickValue);
        if (myGain < settings.minMyGain) continue;

        const theirLineupDelta = theirEval(receiveIds, S.assets) - theirBase;
        const theirGain =
          theirLineupDelta + PICK_GAIN_WEIGHT * (S.pickValue - R.pickValue);
        if (theirGain < settings.minTheirGain) continue;

        // ---- score: my gain first, then likelihood-to-accept signals ----
        const receivedPlayers = R.assets.filter((a) => !a.isPick);
        const nonStarterFrac = receivedPlayers.length
          ? receivedPlayers.filter((a) => !theirStarters.has(a.id)).length /
            receivedPlayers.length
          : 0;
        const overpay = Math.max(0, S.dv - R.dv);
        const score =
          myGain +
          0.3 * Math.min(theirGain, 400) + // deals that clearly help them get accepted
          120 * nonStarterFrac - // their bench is easier to pry loose
          0.05 * overpay; // prefer paying less for the same gain

        const key = R.assets
          .map((a) => a.id)
          .sort()
          .join(",");
        const existing = bestByReceive.get(key);
        if (existing && existing._score >= score) continue;

        bestByReceive.set(key, {
          targetTeam: opp.ownerName,
          targetRosterId: opp.rosterId,
          receive: R.assets,
          send: S.assets,
          myLineupGain: Math.round(myGain),
          theirGain: Math.round(theirGain),
          packageValue: Math.round(S.dv),
          targetValue: Math.round(R.dv),
          why: buildWhy({
            receive: R.assets,
            send: S.assets,
            opp,
            myGain,
            theirGain,
            targetPosition,
            targetTier,
            currentHolder,
            theirStarters,
          }),
          _score: score,
        });
      }
    }

    // Per-opponent diversity cap, plus a cap of 2 proposals per received
    // headliner so one stud doesn't crowd out every flex-tier deal.
    const ranked = [...bestByReceive.values()].sort(
      (a, b) => b._score - a._score,
    );
    const byHeadliner = new Map<string, number>();
    const picked: typeof ranked = [];
    for (const p of ranked) {
      const head = p.receive.reduce((a, b) => (a.value >= b.value ? a : b)).id;
      const count = byHeadliner.get(head) ?? 0;
      if (count >= 2) continue;
      byHeadliner.set(head, count + 1);
      picked.push(p);
      if (picked.length >= settings.maxPerTeam) break;
    }
    proposals.push(...picked);
  }

  proposals.sort((a, b) => b._score - a._score);
  return proposals.slice(0, settings.numResults).map(stripScore);
}

// ---------------------------------------------------------------------------
// Manual evaluation (trade calculator)
// ---------------------------------------------------------------------------

export interface TradeEvaluation {
  myGain: number; // lineup delta + pick credit
  theirGain: number;
  myLineupDelta: number;
  theirLineupDelta: number;
  sendDV: number; // consolidation-discounted
  receiveDV: number;
  sendRaw: number;
  receiveRaw: number;
  verdict: string;
}

/** Score a hand-built trade with the exact same math the finder uses. */
export function evaluateTrade(
  myTeam: TeamState,
  opp: TeamState,
  send: Asset[],
  receive: Asset[],
  rosterPositions: string[],
): TradeEvaluation {
  const myEval = makeLineupEvaluator(myTeam.assets, rosterPositions);
  const theirEval = makeLineupEvaluator(opp.assets, rosterPositions);
  const sendIds = new Set(send.map((a) => a.id));
  const receiveIds = new Set(receive.map((a) => a.id));
  const sendPicks = send
    .filter((a) => a.isPick)
    .reduce((s, a) => s + a.value, 0);
  const receivePicks = receive
    .filter((a) => a.isPick)
    .reduce((s, a) => s + a.value, 0);

  const myLineupDelta = myEval(sendIds, receive) - myEval(new Set(), []);
  const theirLineupDelta =
    theirEval(receiveIds, send) - theirEval(new Set(), []);
  const myGain = myLineupDelta + PICK_GAIN_WEIGHT * (receivePicks - sendPicks);
  const theirGain =
    theirLineupDelta + PICK_GAIN_WEIGHT * (sendPicks - receivePicks);

  const sendDV = packageValue(send);
  const receiveDV = packageValue(receive);

  const parts: string[] = [];
  if (myGain > 0 && theirGain > 0) {
    parts.push("Both starting lineups improve â€” this is a deal worth sending.");
  } else if (myGain > 0 && theirGain <= 0) {
    parts.push(
      `Wins for you, but ${opp.ownerName}'s side gets worse â€” expect a decline unless they value these players differently.`,
    );
  } else if (myGain <= 0 && theirGain > 0) {
    parts.push(`This helps ${opp.ownerName} more than you â€” don't send it.`);
  } else {
    parts.push("Neither lineup improves â€” pass on this one.");
  }
  if (receiveDV > 0) {
    const ratio = sendDV / receiveDV;
    if (ratio > 1.1)
      parts.push(
        `You're paying a ${fmt((ratio - 1) * 100)}% premium on value.`,
      );
    else if (ratio < 0.9)
      parts.push(
        `You're underpaying by ${fmt((1 - ratio) * 100)}% â€” sweeten it if they hesitate.`,
      );
    else parts.push("Value is close to even after the consolidation discount.");
  }

  return {
    myGain: Math.round(myGain),
    theirGain: Math.round(theirGain),
    myLineupDelta: Math.round(myLineupDelta),
    theirLineupDelta: Math.round(theirLineupDelta),
    sendDV: Math.round(sendDV),
    receiveDV: Math.round(receiveDV),
    sendRaw: Math.round(send.reduce((s, a) => s + a.value, 0)),
    receiveRaw: Math.round(receive.reduce((s, a) => s + a.value, 0)),
    verdict: parts.join(" "),
  };
}

export interface AddSuggestion {
  asset: Asset;
  side: "send" | "receive"; // which package the asset joins
  evaluation: TradeEvaluation; // the deal re-scored with the add included
}

// Fair band for the calculator's balance check (send DV / receive DV).
const FAIR_LO = 0.95;
const FAIR_HI = 1.1;

/**
 * When a hand-built trade is lopsided, propose sweeteners: assets from the
 * lighter side's roster that pull the value ratio back into the fair band.
 * Each candidate is re-scored with the full evaluator, and candidates that
 * make both lineups improve rank first.
 */
export function suggestAdds(
  myTeam: TeamState,
  opp: TeamState,
  send: Asset[],
  receive: Asset[],
  rosterPositions: string[],
  max = 3,
): AddSuggestion[] {
  const base = evaluateTrade(myTeam, opp, send, receive, rosterPositions);
  if (base.sendDV === 0 && base.receiveDV === 0) return [];
  const ratio = base.receiveDV > 0 ? base.sendDV / base.receiveDV : Infinity;

  let side: "send" | "receive";
  if (ratio < FAIR_LO)
    side = "send"; // I'm light â€” I add
  else if (ratio > FAIR_HI)
    side = "receive"; // they're light â€” they add
  else return []; // already fair

  const inTrade = new Set([...send, ...receive].map((a) => a.id));
  const roster = side === "send" ? myTeam.assets : opp.assets;
  const candidates = roster.filter((a) => !inTrade.has(a.id) && a.value > 0);

  const scored = candidates
    .map((asset) => {
      const s2 = side === "send" ? [...send, asset] : send;
      const r2 = side === "receive" ? [...receive, asset] : receive;
      const evaluation = evaluateTrade(myTeam, opp, s2, r2, rosterPositions);
      const newRatio =
        evaluation.receiveDV > 0
          ? evaluation.sendDV / evaluation.receiveDV
          : Infinity;
      if (!Number.isFinite(newRatio) || newRatio <= 0) return null;
      return {
        asset,
        side,
        evaluation,
        fairness: Math.abs(Math.log(newRatio)), // 0 = perfectly even
        bothGain: evaluation.myGain > 0 && evaluation.theirGain > 0,
        inBand: newRatio >= FAIR_LO - 0.03 && newRatio <= FAIR_HI + 0.05,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort(
      (a, b) =>
        Number(b.bothGain) - Number(a.bothGain) ||
        Number(b.inBand) - Number(a.inBand) ||
        a.fairness - b.fairness,
    );

  return scored.slice(0, max).map(({ asset, side: s, evaluation }) => ({
    asset,
    side: s,
    evaluation,
  }));
}

// ---------------------------------------------------------------------------
// Explanation
// ---------------------------------------------------------------------------

function positionRankOnRoster(team: TeamState, asset: Asset): number {
  const same = team.assets
    .filter((a) => a.position === asset.position && !a.isPick)
    .sort((a, b) => b.value - a.value);
  return same.findIndex((a) => a.id === asset.id) + 1;
}

function buildWhy(args: {
  receive: Asset[];
  send: Asset[];
  opp: TeamState;
  myGain: number;
  theirGain: number;
  targetPosition?: CorePosition;
  targetTier: number;
  currentHolder: Asset | null;
  theirStarters: Set<string>;
}): string {
  const {
    receive,
    send,
    opp,
    myGain,
    theirGain,
    targetPosition,
    targetTier,
    currentHolder,
    theirStarters,
  } = args;
  const parts: string[] = [];
  const main = receive.filter((a) => !a.isPick)[0] ?? receive[0];
  const extras = receive.filter((a) => a !== main);

  if (targetPosition && main && !main.isPick) {
    if (currentHolder) {
      parts.push(
        `${main.name} (${fmt(main.value)}) displaces ${currentHolder.name} (${fmt(
          currentHolder.value,
        )}) as your ${targetPosition}${targetTier}` +
          (extras.length
            ? `, with ${extras.map((e) => e.name).join(" + ")} along for depth`
            : "") +
          `.`,
      );
    } else {
      parts.push(
        `${main.name} (${fmt(main.value)}) fills your open ${targetPosition}${targetTier} slot.`,
      );
    }
  } else if (main) {
    parts.push(
      `You land ${receive.map((a) => `${a.name} (${fmt(a.value)})`).join(" + ")}.`,
    );
  }
  parts.push(`Your projected starting lineup improves by ${fmt(myGain)}.`);

  if (main && !main.isPick) {
    const oppRank = positionRankOnRoster(opp, main);
    if (!theirStarters.has(main.id)) {
      parts.push(
        `${main.name} is ${opp.ownerName}'s ${main.position}${oppRank} and sits outside their optimal lineup â€” surplus they can sell.`,
      );
    } else {
      parts.push(
        `${main.name} starts for ${opp.ownerName}, but the return upgrades weaker spots in their lineup.`,
      );
    }
  }

  const sendPlayers = send.filter((s) => !s.isPick);
  const sendPicks = send.filter((s) => s.isPick);
  const pieces = [
    sendPlayers.map((s) => s.name).join(" + "),
    sendPicks.map((p) => p.name).join(" + "),
  ]
    .filter(Boolean)
    .join(" plus ");
  parts.push(
    `${opp.ownerName}'s side nets a projected gain of ${fmt(theirGain)} from ${pieces}.`,
  );

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Three-team trades
// ---------------------------------------------------------------------------

const TRI_BUDGET = 30000; // triple-evaluations across all opponent pairs
const TRI_LEG_CAP = 2; // assets per leg
const TRI_POOL_CAP = 10;
const TRI_COMPLEXITY_PENALTY = 60; // 3-team deals are harder to close

function names(assets: Asset[]): string {
  return assets.map((a) => a.name).join(" + ");
}

function targetBand(
  myTeam: TeamState,
  targetPosition: CorePosition | undefined,
  targetTier: number
): { lo: number; hi: number } {
  if (!targetPosition) return { lo: 0, hi: Infinity };
  const myAtPos = myTeam.assets
    .filter((a) => a.position === targetPosition)
    .sort((a, b) => b.value - a.value);
  const holder = myAtPos[Math.max(1, Math.min(5, targetTier)) - 1] ?? null;
  const floor = holder?.value ?? 0;
  return {
    lo: Math.max(floor * 1.12, floor + 150, 150),
    hi: holder ? Math.max(floor * 3.2, 3000) : Infinity,
  };
}

/**
 * Generalized 3-team trades. Not just cycles: your send can split across both
 * teams, both teams can send you players, and a single balancing asset can
 * move between the two other teams. Every team must both give and receive at
 * least one asset, every team's give/get value sits inside the fairness
 * window, and all three optimal lineups must improve.
 */
export function findThreeTeamTrades(
  input: TradeSearchInput & { requiredRosterId?: number },
): TradeProposal[] {
  const { myTeam, opponents, rosterPositions, settings } = input;
  if (opponents.length < 2) return [];
  const targetPosition =
    settings.mode === "target" ? input.targetPosition : undefined;
  const band = targetBand(myTeam, targetPosition, input.targetTier ?? 1);
  const untouchable = new Set(settings.untouchableIds);
  const legMax = Math.min(TRI_LEG_CAP, settings.maxSend);
  const recvMax = Math.min(TRI_LEG_CAP, settings.maxReceive);
  const okAsset = (a: Asset) => settings.includePicks || !a.isPick;
  const EMPTY: Pkg = {
    assets: [],
    dv: 0,
    raw: 0,
    pickValue: 0,
    best: null as unknown as Asset,
  };
  const pickSum = (xs: Asset[]) =>
    xs.filter((a) => a.isPick).reduce((s, a) => s + a.value, 0);

  const myPkgs = [
    EMPTY,
    ...buildPackages(
      myTeam.assets.filter((a) => !untouchable.has(a.id) && okAsset(a)),
      legMax,
      TRI_POOL_CAP,
    ),
  ].sort((a, b) => a.dv - b.dv);
  const myEval = makeLineupEvaluator(myTeam.assets, rosterPositions);
  const myBase = myEval(new Set(), []);

  const oppState = new Map(
    opponents.map((o) => {
      const ev = makeLineupEvaluator(o.assets, rosterPositions);
      return [
        o.rosterId,
        {
          team: o,
          toMe: [
            EMPTY,
            ...buildPackages(o.assets.filter(okAsset), recvMax, TRI_POOL_CAP)
              .sort((x, y) => y.dv - x.dv)
              .slice(0, 12),
          ],
          balancers: o.assets
            .filter((a) => okAsset(a) && a.value > 0)
            .sort((x, y) => y.value - x.value)
            .slice(0, 8),
          eval: ev,
          base: ev(new Set(), []),
        },
      ];
    }),
  );

  const ids = opponents.map((o) => o.rosterId);
  const pairs: [number, number][] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      if (
        input.requiredRosterId != null &&
        ids[i] !== input.requiredRosterId &&
        ids[j] !== input.requiredRosterId
      )
        continue;
      pairs.push([ids[i], ids[j]]);
    }
  const perPair = Math.max(
    250,
    Math.floor(TRI_BUDGET / Math.max(1, pairs.length)),
  );
  const inWindow = (give: number, get: number) =>
    get > 0 &&
    give >= get * settings.fairFloor &&
    give <= get * settings.overpayCap;

  const out: (TradeProposal & { _score: number })[] = [];

  for (const [bId, cId] of pairs) {
    const B = oppState.get(bId)!;
    const C = oppState.get(cId)!;
    let evals = 0;
    let work = 0;
    const workCap = perPair * 25;
    let best: (TradeProposal & { _score: number }) | null = null;

    for (const RB of B.toMe) {
      if (evals >= perPair || work >= workCap) break;
      for (const RC of C.toMe) {
        if (evals >= perPair || work >= workCap) break;
        const inAssets = [...RB.assets, ...RC.assets];
        if (!inAssets.length) continue;
        if (targetPosition) {
          const head = inAssets
            .filter((a) => !a.isPick)
            .sort((x, y) => y.value - x.value)[0];
          if (
            !head ||
            head.position !== targetPosition ||
            head.value < band.lo ||
            head.value > band.hi
          )
            continue;
        }
        const inDv = packageValue(inAssets);
        const loOut = inDv * settings.fairFloor;
        const hiOut = inDv * settings.overpayCap;

        for (const SB of myPkgs) {
          if (evals >= perPair || work >= workCap) break;
          if (SB.dv > hiOut) break; // sorted ascending
          const sbIds = new Set(SB.assets.map((a) => a.id));
          for (const SC of myPkgs) {
            work++;
            if (evals >= perPair || work >= workCap) break;
            const outAssets = [...SB.assets, ...SC.assets];
            if (!outAssets.length) continue;
            if (SC.assets.some((a) => sbIds.has(a.id))) continue;
            const outDv = packageValue(outAssets);
            if (outDv < loOut || outDv > hiOut) continue;

            // Balancing options: none, one asset B->C, or one asset C->B.
            const options: { bc: Asset | null; cb: Asset | null }[] = [
              { bc: null, cb: null },
            ];
            for (const a of B.balancers)
              if (!RB.assets.includes(a)) options.push({ bc: a, cb: null });
            for (const a of C.balancers)
              if (!RC.assets.includes(a)) options.push({ bc: null, cb: a });

            for (const L of options) {
              work++;
              if (evals >= perPair || work >= workCap) break;
              const bOut = [...RB.assets, ...(L.bc ? [L.bc] : [])];
              const bIn = [...SB.assets, ...(L.cb ? [L.cb] : [])];
              const cOut = [...RC.assets, ...(L.cb ? [L.cb] : [])];
              const cIn = [...SC.assets, ...(L.bc ? [L.bc] : [])];
              // Every team must both give and receive.
              if (!bOut.length || !bIn.length || !cOut.length || !cIn.length)
                continue;
              const bOutDv = packageValue(bOut);
              const bInDv = packageValue(bIn);
              if (!inWindow(bOutDv, bInDv)) continue;
              const cOutDv = packageValue(cOut);
              const cInDv = packageValue(cIn);
              if (!inWindow(cOutDv, cInDv)) continue;

              evals++;
              const myGain =
                myEval(new Set(outAssets.map((a) => a.id)), inAssets) -
                myBase +
                PICK_GAIN_WEIGHT * (pickSum(inAssets) - pickSum(outAssets));
              if (myGain < settings.minMyGain) continue;
              const bGain =
                B.eval(new Set(bOut.map((a) => a.id)), bIn) -
                B.base +
                PICK_GAIN_WEIGHT * (pickSum(bIn) - pickSum(bOut));
              if (bGain < settings.minTheirGain) continue;
              const cGain =
                C.eval(new Set(cOut.map((a) => a.id)), cIn) -
                C.base +
                PICK_GAIN_WEIGHT * (pickSum(cIn) - pickSum(cOut));
              if (cGain < settings.minTheirGain) continue;

              const pieces =
                outAssets.length + inAssets.length + (L.bc || L.cb ? 1 : 0);
              const score =
                myGain +
                0.25 * Math.min(Math.min(bGain, cGain), 400) -
                TRI_COMPLEXITY_PENALTY -
                4 * pieces; // prefer the simplest deal at equal gain
              if (best && best._score >= score) continue;

              const seg: string[] = [];
              if (SB.assets.length)
                seg.push(`you send ${names(SB.assets)} to ${B.team.ownerName}`);
              if (SC.assets.length)
                seg.push(`you send ${names(SC.assets)} to ${C.team.ownerName}`);
              if (RB.assets.length)
                seg.push(`${B.team.ownerName} sends you ${names(RB.assets)}`);
              if (RC.assets.length)
                seg.push(`${C.team.ownerName} sends you ${names(RC.assets)}`);
              if (L.bc)
                seg.push(
                  `${B.team.ownerName} sends ${L.bc.name} to ${C.team.ownerName}`,
                );
              if (L.cb)
                seg.push(
                  `${C.team.ownerName} sends ${L.cb.name} to ${B.team.ownerName}`,
                );

              best = {
                targetTeam: `${B.team.ownerName} + ${C.team.ownerName}`,
                targetRosterId: (RC.assets.length ? C : B).team.rosterId,
                receive: inAssets,
                send: outAssets,
                myLineupGain: Math.round(myGain),
                theirGain: Math.round(Math.min(bGain, cGain)),
                packageValue: Math.round(outDv),
                targetValue: Math.round(inDv),
                via: [
                  {
                    rosterId: B.team.rosterId,
                    teamName: B.team.ownerName,
                    receives: bIn,
                    sends: bOut,
                    gain: Math.round(bGain),
                  },
                  {
                    rosterId: C.team.rosterId,
                    teamName: C.team.ownerName,
                    receives: cIn,
                    sends: cOut,
                    gain: Math.round(cGain),
                  },
                ],
                why:
                  `Three-team deal: ${seg.join("; ")}. ` +
                  `All three lineups improve â€” you +${fmt(myGain)}, ${B.team.ownerName} +${fmt(bGain)}, ${C.team.ownerName} +${fmt(cGain)}.`,
                _score: score,
              };
            }
          }
        }
      }
    }
    if (best) out.push(best);
  }

  out.sort((a, b) => b._score - a._score);
  return out.slice(0, settings.numResults).map(stripScore);
}

const STAR_BUDGET = 20000;

/**
 * Star-shaped 3-team trades for Player deals when wanted players sit on
 * exactly two rosters: you receive both wanted packages, and split your send
 * between the two teams. All three lineups must improve.
 */
export function findStarTrades(input: TradeSearchInput): TradeProposal[] {
  const { myTeam, opponents, rosterPositions, settings } = input;
  const wanted = new Set(input.wantedIds ?? []);
  const holders = opponents.filter((o) => o.assets.some((a) => wanted.has(a.id)));
  if (holders.length !== 2) return [];
  const [B, C] = holders;
  const pinnedExact = input.pinnedExact === true;
  const untouchable = new Set(settings.untouchableIds);
  const ship = new Set(input.shipIds ?? []);

  const receiveOptionsFor = (t: TeamState) => {
    const required = t.assets.filter((a) => wanted.has(a.id));
    const extras = pinnedExact
      ? []
      : t.assets.filter(
          (a) => !wanted.has(a.id) && (settings.includePicks || !a.isPick)
        );
    return buildPackagesRequired(required, extras, settings.maxReceive, TRI_POOL_CAP)
      .sort((a, b) => a.dv - b.dv)
      .slice(0, 12);
  };
  const rbOptions = receiveOptionsFor(B);
  const rcOptions = receiveOptionsFor(C);

  const legMax = Math.min(TRI_LEG_CAP, settings.maxSend);
  const myPool = myTeam.assets.filter(
    (a) =>
      (ship.has(a.id) || !untouchable.has(a.id)) &&
      (settings.includePicks || !a.isPick)
  );
  const myPkgs = buildPackages(myPool, legMax, 12).sort((a, b) => a.dv - b.dv);

  const myEval = makeLineupEvaluator(myTeam.assets, rosterPositions);
  const myBase = myEval(new Set(), []);
  const mkState = (t: TeamState) => {
    const ev = makeLineupEvaluator(t.assets, rosterPositions);
    return { team: t, eval: ev, base: ev(new Set(), []) };
  };
  const bState = mkState(B);
  const cState = mkState(C);

  let count = 0;
  let best: (TradeProposal & { _score: number }) | null = null;

  for (const RB of rbOptions) {
    for (const RC of rcOptions) {
      if (count >= STAR_BUDGET) break;
      const startB = lowerBound(myPkgs, RB.dv * settings.fairFloor);
      for (let i = startB; i < myPkgs.length; i++) {
        const SB = myPkgs[i];
        if (SB.dv > RB.dv * settings.overpayCap) break;
        if (count >= STAR_BUDGET) break;
        const sbIds = new Set(SB.assets.map((a) => a.id));
        const startC = lowerBound(myPkgs, RC.dv * settings.fairFloor);
        for (let j = startC; j < myPkgs.length; j++) {
          const SC = myPkgs[j];
          if (SC.dv > RC.dv * settings.overpayCap) break;
          if (count >= STAR_BUDGET) break;
          if (SC.assets.some((a) => sbIds.has(a.id))) continue; // disjoint legs
          // Every shipped player must actually be in one of my legs.
          if (
            ship.size &&
            ![...ship].every(
              (id) => sbIds.has(id) || SC.assets.some((a) => a.id === id)
            )
          )
            continue;
          count++;

          const myOut = [...SB.assets, ...SC.assets];
          const myIn = [...RB.assets, ...RC.assets];
          const myGain =
            myEval(new Set(myOut.map((a) => a.id)), myIn) -
            myBase +
            PICK_GAIN_WEIGHT *
              (RB.pickValue + RC.pickValue - SB.pickValue - SC.pickValue);
          if (myGain < settings.minMyGain) continue;
          const bGain =
            bState.eval(new Set(RB.assets.map((a) => a.id)), SB.assets) -
            bState.base +
            PICK_GAIN_WEIGHT * (SB.pickValue - RB.pickValue);
          if (bGain < settings.minTheirGain) continue;
          const cGain =
            cState.eval(new Set(RC.assets.map((a) => a.id)), SC.assets) -
            cState.base +
            PICK_GAIN_WEIGHT * (SC.pickValue - RC.pickValue);
          if (cGain < settings.minTheirGain) continue;

          const score =
            myGain +
            0.25 * Math.min(Math.min(bGain, cGain), 400) -
            TRI_COMPLEXITY_PENALTY;
          if (best && best._score >= score) continue;
          best = {
            targetTeam: `${B.ownerName} + ${C.ownerName}`,
            targetRosterId: C.rosterId,
            receive: myIn,
            send: myOut,
            myLineupGain: Math.round(myGain),
            theirGain: Math.round(Math.min(bGain, cGain)),
            packageValue: Math.round(packageValue(myOut)),
            targetValue: Math.round(packageValue(myIn)),
            via: [
              {
                rosterId: B.rosterId,
                teamName: B.ownerName,
                receives: SB.assets,
                sends: RB.assets,
                gain: Math.round(bGain),
              },
              {
                rosterId: C.rosterId,
                teamName: C.ownerName,
                receives: SC.assets,
                sends: RC.assets,
                gain: Math.round(cGain),
              },
            ],
            why:
              `Three-team deal: ${B.ownerName} sends ${names(RB.assets)} for ${names(SB.assets)}, ` +
              `${C.ownerName} sends ${names(RC.assets)} for ${names(SC.assets)}. ` +
              `All three lineups improve â€” you +${fmt(myGain)}, ${B.ownerName} +${fmt(bGain)}, ${C.ownerName} +${fmt(cGain)}.`,
            _score: score,
          };
        }
      }
    }
  }

  if (!best) return [];
  return [stripScore(best)];
}

// ---------------------------------------------------------------------------
// Clipboard â€” the app can't submit trades (Sleeper's API is read-only), so
// this text is the deliverable the user recreates in the Sleeper app.
// ---------------------------------------------------------------------------

export function proposalToClipboard(
  p: TradeProposal,
  leagueName: string,
  myName: string,
): string {
  const label = (a: Asset) => `${a.name}${a.isPick ? "" : ` (${a.position})`}`;
  if (p.via) {
    return [
      `Trade proposal â€” ${leagueName} (3-team)`,
      ``,
      `${myName} sends: ${p.send.map(label).join(", ")}`,
      `${myName} receives: ${p.receive.map(label).join(", ")}`,
      ...p.via.map(
        (leg) =>
          `${leg.teamName} sends: ${leg.sends.map(label).join(", ")} Â· receives: ${leg.receives.map(label).join(", ")}`
      ),
      ``,
      `Pitch: ${p.why}`,
    ].join("\n");
  }
  return [
    `Trade proposal â€” ${leagueName}`,
    ``,
    `${myName} sends: ${p.send.map(label).join(", ")}`,
    `${p.targetTeam} sends: ${p.receive.map(label).join(", ")}`,
    ``,
    `Pitch: ${p.why}`,
    ``,
    `Values (FantasyCalc, consolidation-adjusted): ${p.packageValue.toLocaleString()} for ${p.targetValue.toLocaleString()}`,
  ].join("\n");
}
