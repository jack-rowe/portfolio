import type { Game, Player, Result } from "~firebase/types";
import { formatDay } from "../_lib/dates";
import { pickBoardDay } from "../_lib/stats";
import { DayView } from "./DayView";

type Props = {
    players: Player[];
    games: Game[];
    /** Already limited to games on the board. */
    results: Result[];
    today: string;
};

export function TodayTab({ today, ...props }: Props) {
    const day = pickBoardDay(props.results, today);
    if (!day) return <p className="py-8 text-center text-muted-foreground">No scores yet.</p>;

    return (
        <DayView
            {...props}
            day={day}
            note={day !== today && `Nothing logged today yet. Showing ${formatDay(day)}.`}
        />
    );
}
