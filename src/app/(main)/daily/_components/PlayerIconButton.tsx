import { Crown } from "lucide-react"
import { useContext } from "react"
import { cn } from "@/lib/utils"
import type { Player } from "~firebase/types"
import { ChampionsContext } from "./champions"
import { IconButton, IconButtonProps, IconTile } from "./IconButton"

type Props = Omit<IconButtonProps, "src" | "label" | "initials"> & {
    player: Pick<Player, "slug" | "name">
}

/** "Jack Rowe" -> "JR", "Jack" -> "J". */
export function playerInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return ""
    const first = words[0].charAt(0)
    const last = words.length > 1 ? words[words.length - 1].charAt(0) : ""
    return (first + last).toUpperCase()
}

export function PlayerIconButton({ player, showLabel = true, className, ...props }: Props) {
    return (
        <IconButton
            label={player.name}
            initials={playerInitials(player.name)}
            showLabel={showLabel}
            className={cn("rounded-full", className)}
            {...props}
        />
    )
}

type PlayerIconProps = {
    player: Pick<Player, "slug" | "name">
    size?: "xs" | "sm" | "md"
    /**
     * "champion" crowns them and rings them in gold if they won last week.
     * "gold" always rings them in gold, for marking a past weekly win.
     */
    badge?: "champion" | "gold"
}

export function PlayerIcon({ player, size = "xs", badge }: PlayerIconProps) {
    const champion = useContext(ChampionsContext).has(player.slug)
    const crowned = badge === "champion" && champion
    const gold = crowned || badge === "gold"
    const tile = (
        <IconTile
            label={player.name}
            initials={playerInitials(player.name)}
            size={size}
            className={cn("rounded-full", size === "xs" && "text-[0.6rem]", gold && "border-amber-500")}
        />
    )
    if (!crowned) return tile

    // The tile clips its contents, so the crown sits on a wrapper above it.
    return (
        <span className="relative inline-flex shrink-0">
            {tile}
            <Crown
                aria-hidden
                className={cn(
                    "absolute left-1/2 -translate-x-1/2 fill-amber-400 text-amber-600 drop-shadow-sm",
                    size === "xs" ? "-top-2 h-3 w-3" : size === "sm" ? "-top-2.5 h-4 w-4" : "-top-3.5 h-5 w-5"
                )}
            />
        </span>
    )
}
