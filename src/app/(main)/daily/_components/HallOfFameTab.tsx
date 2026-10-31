import {
    Coins,
    Crown,
    Flame,
    Sparkles,
    Swords,
    TrendingUp,
    Trophy,
    type LucideIcon,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Game, Player, Result } from "~firebase/types";
import { formatShortDay, formatWeek } from "../_lib/dates";
import { hallOfFame, type Feat, type ResultMark, type Top } from "../_lib/records";
import { formatPoints, type WeekResult } from "../_lib/stats";
import { GameIcon } from "./GameIconButton";
import { PlayerIcon } from "./PlayerIconButton";
import {
    ABOUT,
    BestDayDetail,
    BlowoutDetail,
    CrownRunDetail,
    LeadStreakDetail,
    MarkDetail,
    MostPointsDetail,
    PerHolder,
    PlayStreakDetail,
    RecordDialog,
    SolveStreakDetail,
    SweepsDetail,
    type DetailProps,
    type PlayerOf,
    type RecordContext,
} from "./RecordDetails";

/** Holders named before the rest collapse into "+N". */
const SHOWN_HOLDERS = 2;

type Props = {
    players: Player[];
    games: Game[];
    results: Result[];
    today: string;
    weeks: WeekResult[];
};

type Stat = {
    label: string;
    icon: LucideIcon;
    top: Top | null;
    value: (v: number) => string;
    unit: (v: number) => string;
    detail: (f: Feat) => string;
    hint?: string;
    /** How the calculation works, shown when the tile opens. */
    about: string;
    /** The working for one holder. */
    Detail: React.ComponentType<DetailProps>;
};

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);
const count = (word: string) => (n: number) => plural(n, word);
const whole = (v: number) => String(Math.round(v));
const through = (f: Feat) => `thru ${formatShortDay(f.date)}`;

export function HallOfFameTab({ players, games, results, today, weeks }: Props) {
    if (results.length === 0) {
        return <p className="py-8 text-center text-muted-foreground">No scores yet, so no records.</p>;
    }

    const hof = hallOfFame(games, results, weeks, today);
    const byPlayer = new Map(players.map((p) => [p.slug, p]));
    const playerOf: PlayerOf = (slug) => byPlayer.get(slug) ?? { slug, name: slug };
    const gameName = (slug?: string) => games.find((g) => g.slug === slug)?.name ?? "";
    const dayRating = (f: Feat) => `${formatShortDay(f.date)} · ${String(f.games ?? 0)} games`;
    const ctx: RecordContext = { players, games, results: results.filter((r) => r.date <= today), weeks, playerOf };

    const headline: Stat[] = [
        {
            label: "Best day",
            icon: Trophy,
            top: hof.bestDay,
            value: whole,
            unit: () => "/ 100",
            detail: dayRating,
            hint: "Average percentile against each game's history",
            about: ABOUT.bestDay,
            Detail: BestDayDetail,
        },
        {
            label: "Most points in a day",
            icon: Coins,
            top: hof.mostPoints,
            value: formatPoints,
            unit: () => "pts",
            detail: (f) => `${formatShortDay(f.date)} · ${String(f.players ?? 0)} players`,
            hint: "Easier on days fewer people play",
            about: ABOUT.mostPoints,
            Detail: MostPointsDetail,
        },
        {
            label: "Biggest blowout",
            icon: Swords,
            top: hof.blowout,
            value: (v) => whole(v * 100),
            unit: () => "% of pot",
            detail: (f) => `${gameName(f.game)} · ${formatShortDay(f.date)}`,
            hint: "Largest share of one game's points",
            about: ABOUT.blowout,
            Detail: BlowoutDetail,
        },
    ];

    const streaks: Stat[] = [
        {
            label: "Clean sweeps",
            icon: Sparkles,
            top: hof.sweeps,
            value: String,
            unit: () => "",
            detail: (f) => `last ${formatShortDay(f.date)}`,
            about: ABOUT.sweeps,
            Detail: SweepsDetail,
        },
        {
            label: "Days played in a row",
            icon: Flame,
            top: hof.playStreak,
            value: String,
            unit: count("day"),
            detail: through,
            about: ABOUT.playStreak,
            Detail: PlayStreakDetail,
        },
        {
            label: "Days in a row on top",
            icon: TrendingUp,
            top: hof.leadStreak,
            value: String,
            unit: count("day"),
            detail: through,
            about: ABOUT.leadStreak,
            Detail: LeadStreakDetail,
        },
        {
            label: "Weeks wearing the crown",
            icon: Crown,
            top: hof.crownRun,
            value: String,
            unit: count("week"),
            detail: (f) => `thru ${formatWeek(f.date)}`,
            about: ABOUT.crownRun,
            Detail: CrownRunDetail,
        },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="grid gap-4 sm:grid-cols-3">
                {headline.map((r) => (
                    <StatTile key={r.label} stat={r} ctx={ctx} size="lg" />
                ))}
            </div>

            <Section title="Streaks">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {streaks.map((r) => (
                        <StatTile key={r.label} stat={r} ctx={ctx} size="md" />
                    ))}
                </div>
            </Section>

            <Section
                title="By game"
                note="First to hit a record holds it. ×N is how many times it's been hit. Tap any record for the details."
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Game</TableHead>
                            <TableHead>Best ever</TableHead>
                            <TableHead>Worst ever</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {hof.games.map((g) => (
                            <TableRow key={g.game.slug}>
                                <TableCell>
                                    <span className="flex items-center gap-2 font-medium">
                                        <GameIcon game={g.game} size="xs" />
                                        <span className="truncate">{g.game.name}</span>
                                    </span>
                                </TableCell>
                                {g.game.type === "solved" ? (
                                    <>
                                        <TableCell>
                                            <SolveStreakCell game={g.game} top={g.solveStreak} ctx={ctx} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">–</TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell>
                                            <MarkCell game={g.game} mark={g.best} label="Best ever" ctx={ctx} />
                                        </TableCell>
                                        <TableCell>
                                            <MarkCell game={g.game} mark={g.worst} label="Worst ever" ctx={ctx} muted />
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Section>
        </div>
    );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <h3 className="font-clash text-lg font-bold leading-tight">{title}</h3>
            {children}
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </section>
    );
}

/** "Sam", "Sam & Alex", or "Sam & Alex +2", with their icons. */
function HolderNames({ top, playerOf }: { top: Top; playerOf: PlayerOf }) {
    const slugs = [...new Set(top.holders.map((h) => h.player))];
    const shown = slugs.slice(0, SHOWN_HOLDERS).map((slug) => playerOf(slug));
    const extra = slugs.length - shown.length;
    return (
        <span className="flex min-w-0 items-center gap-1.5">
            <span className="flex shrink-0 -space-x-1">
                {shown.map((p) => (
                    <PlayerIcon key={p.slug} player={p} badge="champion" />
                ))}
            </span>
            <span className="truncate font-medium">
                {shown.map((p) => p.name).join(" & ")}
                {extra > 0 && <span className="text-muted-foreground"> +{extra}</span>}
            </span>
        </span>
    );
}

const TILE = {
    lg: {
        box: "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm",
        value: "text-5xl text-primary",
        unit: "text-sm",
    },
    md: {
        box: "flex flex-col gap-2 rounded-lg border border-transparent bg-muted/50 p-3",
        value: "text-3xl",
        unit: "text-xs",
    },
};

function StatTile({ stat: r, ctx, size }: { stat: Stat; ctx: RecordContext; size: "lg" | "md" }) {
    const style = TILE[size];
    const Icon = r.icon;
    const top = r.top;
    const face = (
        <>
            <span className="flex items-center gap-1.5 pr-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
                {r.label}
            </span>
            {top ? (
                <>
                    <span className="flex items-baseline gap-1.5">
                        <span className={cn("font-clash font-bold leading-none tabular-nums", style.value)}>
                            {r.value(top.value)}
                        </span>
                        <span className={cn("text-muted-foreground", style.unit)}>{r.unit(top.value)}</span>
                    </span>
                    <span className="flex flex-col gap-0.5 text-sm">
                        <HolderNames top={top} playerOf={ctx.playerOf} />
                        <span className="text-xs text-muted-foreground">{r.detail(top.holders[0])}</span>
                    </span>
                </>
            ) : (
                <span className={cn("font-clash font-bold leading-none text-muted-foreground/40", style.value)}>–</span>
            )}
            {r.hint && <span className="mt-auto border-t border-border pt-2 text-xs text-muted-foreground">{r.hint}</span>}
        </>
    );
    return (
        <RecordDialog title={r.label} about={r.about} face={face} className={style.box}>
            {top && <PerHolder top={top} ctx={ctx} Detail={r.Detail} />}
        </RecordDialog>
    );
}

type CellFaceProps = { value: string; player: Pick<Player, "slug" | "name">; detail: string; muted?: boolean };

function CellFace({ value, player, detail, muted }: CellFaceProps) {
    return (
        <span className="flex flex-col gap-1 pr-5">
            <span
                className={cn(
                    "font-clash text-xl font-bold leading-none tabular-nums",
                    muted ? "text-muted-foreground" : "text-primary",
                )}
            >
                {value}
            </span>
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                    <PlayerIcon player={player} />
                    <span className="truncate font-medium">{player.name}</span>
                </span>
                <span className="whitespace-nowrap text-muted-foreground">{detail}</span>
            </span>
        </span>
    );
}

/** Table cells open too; the negative margin lets the hover area fill the cell. */
const CELL = "-m-2 block w-[calc(100%+1rem)] rounded-md border border-transparent p-2";

type MarkCellProps = { game: Game; mark: ResultMark | null; label: string; ctx: RecordContext; muted?: boolean };

function MarkCell({ game, mark, label, ctx, muted }: MarkCellProps) {
    if (!mark) return <span className="text-muted-foreground">–</span>;
    const times = mark.tied.length > 1 ? ` · ×${String(mark.tied.length)}` : "";
    return (
        <RecordDialog
            title={`${game.name}: ${label.toLowerCase()}`}
            about={ABOUT.mark}
            className={CELL}
            face={
                <CellFace
                    value={mark.result.shown}
                    player={ctx.playerOf(mark.result.player)}
                    detail={`${formatShortDay(mark.result.date)}${times}`}
                    muted={muted}
                />
            }
        >
            <MarkDetail ctx={ctx} game={game} mark={mark} />
        </RecordDialog>
    );
}

function SolveStreakCell({ game, top, ctx }: { game: Game; top: Top | null; ctx: RecordContext }) {
    if (!top) return <span className="text-muted-foreground">–</span>;
    return (
        <RecordDialog
            title={`${game.name}: solve streak`}
            about={ABOUT.solveStreak}
            className={CELL}
            face={
                <CellFace
                    value={`${String(top.value)} in a row`}
                    player={ctx.playerOf(top.holders[0].player)}
                    detail={through(top.holders[0])}
                />
            }
        >
            <PerHolder top={top} ctx={ctx} Detail={SolveStreakDetail} />
        </RecordDialog>
    );
}
