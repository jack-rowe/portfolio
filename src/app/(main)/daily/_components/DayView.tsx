import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Game, Player, Result } from "~firebase/types";
import { formatDay } from "../_lib/dates";
import { compareResults } from "../_lib/scoring";
import { dayCards, formatPoints, leaderLine, pickBoardDay } from "../_lib/stats";
import { Container } from "./Container";
import { GameIcon } from "./GameIconButton";
import { PlayerIcon } from "./PlayerIconButton";

type Props = {
    players: Player[];
    games: Game[];
    /** Already limited to games on the board. */
    results: Result[];
    today: string;
};

export function TodayTab({ players, games, results, today }: Props) {
    const day = pickBoardDay(results, today);
    if (!day) return <p className="py-8 text-center text-muted-foreground">No scores yet.</p>;

    const byPlayer = new Map(players.map((p) => [p.slug, p]));
    const nameOf = (slug: string) => byPlayer.get(slug)?.name ?? slug;
    const cards = dayCards(games, results, day);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="font-clash text-2xl font-bold leading-tight">{leaderLine(cards, nameOf)}</p>
                {day !== today && (
                    <p className="text-sm text-muted-foreground">
                        Nothing logged today yet. Showing {formatDay(day)}.
                    </p>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                const player = byPlayer.get(r.player) ?? { slug: r.player, name: r.player };
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
