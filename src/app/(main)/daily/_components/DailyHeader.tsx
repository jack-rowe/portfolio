import { CurrentDate } from "./CurrentDate"

/** `date` is null until the client knows the device's local date. */
export function DailyHeader({ date }: { date: Date | null }) {
    const weekday = date?.toLocaleString('default', { weekday: 'long' })

    return (
        <header className="font-clash flex items-center gap-4 w-full pb-4 border-b-2 border-primary md:gap-6 md:pb-6">
            <CurrentDate date={date} />
            <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm">
                    {weekday ? `${weekday} · ` : ""}Daily Games
                </span>
                <h1 className="text-3xl font-bold leading-none text-foreground sm:text-4xl md:text-5xl">Leaderboard</h1>
            </div>
        </header>
    )
}
