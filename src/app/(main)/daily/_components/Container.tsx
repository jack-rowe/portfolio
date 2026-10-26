import { cn } from "@/lib/utils"

type Props = {
    children: React.ReactNode
    className?: string
}

export function Container({ className, children }: Props) {
    return (
        <div className={cn("border border-border bg-card text-card-foreground rounded-lg shadow-sm p-4", className)}>
            {children}
        </div>
    )
}
