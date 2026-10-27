import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Game, Player, Result } from "~firebase/types";
import { compareResults } from "../_lib/scoring";
import { dayCards, dayTotals, formatPoints, leaderLine } from "../_lib/stats";
import { Container } from "./Container";
import { GameIcon } from "./GameIconButton";
import { PlayerIcon } from "./PlayerIconButton";

type Props = {
    players: Player[];
    games: Game[];
    /** Already limited to games on the board. */
    results: Result[];
    day: string;
    /** Shown under the leader line, e.g. which day this is. */
    note?: React.ReactNode;
};

/** One day's leader line, point totals and per-game results. */
export function DayView({ players, games, results, day, note }: Props) {
    const byPlayer = new Map(players.map((p) => [p.slug, p]));
    const playerOf = (slug: string) => byPlayer.get(slug) ?? { slug, name: slug };
    const cards = dayCards(games, results, day);
    const totals = dayTotals(cards);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="font-clash text-2xl font-bold leading-tight">
                    {leaderLine(cards, (slug) => playerOf(slug).name)}
                </p>
                {note && <p className="text-sm text-muted-foreground">{note}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Container className="flex flex-col gap-3">
                    <h3 className="font-clash text-lg font-bold leading-none">Day total</h3>
                    <ol className="flex flex-col gap-1.5">
                        {totals.map((t) => {
                            const player = playerOf(t.player);
                            const leads = t.rank === 1 && t.points > 0;
                            return (
                                <li key={t.player} className="flex items-center gap-2">
                                    <span className="w-4 text-right text-sm tabular-nums text-muted-foreground">
                                        {t.rank}
                                    </span>
                                    <PlayerIcon player={player} />
                                    <span className={cn("min-w-0 flex-1 truncate", leads && "font-semibold")}>
                                        {player.name}
                                    </span>
                                    {t.wins > 0 && (
                                        <span
                                            aria-label={`${String(t.wins)} win${t.wins === 1 ? "" : "s"}`}
                                            className="flex items-center gap-0.5 text-sm tabular-nums text-muted-foreground"
                                        >
                                            <Crown aria-hidden className="h-3.5 w-3.5" />
                                            {t.wins}
                                        </span>
                                    )}
                                    <span
                                        className={cn(
                                            "font-clash text-lg font-bold tabular-nums",
                                            leads ? "text-primary" : "text-foreground",
                                        )}
                                    >
                                        {formatPoints(t.points)}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                </Container>
                {cards.map(({ game, ranked, winners, points }) => (
                    <Container key={game.slug} className="flex flex-col gap-3">
                        <h3 className="flex items-center gap-2 font-clash text-lg font-bold leading-none">
                            <GameIcon game={game} />
                            {game.name}
                        </h3>
                        <ol className="flex flex-col gap-1.5">
                            {ranked.map((r, i) => {
                                // Tied results share the rank of the first one.
                                const first = ranked.findIndex((o) => compareResults(game, o, r) === 0);
                                const rank = first === -1 ? i + 1 : first + 1;
                                const won = winners.includes(r.player);
                                const player = playerOf(r.player);
                                const earned = points.get(r.player);
                                return (
                                    <li key={r.id} className="flex items-center gap-2">
                                        <span className="w-4 text-right text-sm tabular-nums text-muted-foreground">
                                            {rank}
                                        </span>
                                        <PlayerIcon player={player} />
                                        <span className={cn("min-w-0 flex-1 truncate", won && "font-semibold")}>
                                            {player.name}
                                        </span>
                                        {won && <Crown aria-label="Winner" className="h-4 w-4 shrink-0 text-primary" />}
                                        <span
                                            className={cn(
                                                "font-clash text-lg font-bold tabular-nums",
                                                r.fail ? "text-muted-foreground" : won ? "text-primary" : "text-foreground",
                                            )}
                                        >
                                            {r.shown}
                                        </span>
                                        {earned !== undefined && (
                                            <span
                                                aria-label={`${formatPoints(earned)} points`}
                                                className="w-10 text-right text-sm tabular-nums text-muted-foreground"
                                            >
                                                +{formatPoints(earned)}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </Container>
                ))}
            </div>
        </div>
    );
}
