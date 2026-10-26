export function CurrentDate({ date }: { date: Date | null }) {
    const date_number = date?.getDate()
    const date_month = date?.toLocaleString('default', { month: 'short' });

    return (
        <div className="flex flex-col shrink-0 border-2 border-primary rounded-sm w-14 h-14 overflow-hidden md:w-16 md:h-16">
            <span className="bg-primary text-background flex items-center justify-center w-full h-2/5 text-xs font-semibold uppercase tracking-wider md:text-sm">{date_month}</span>
            <span className="text-foreground flex items-center justify-center w-full h-3/5 text-xl font-bold md:text-2xl">{date_number}</span>
        </div>
    )
}
