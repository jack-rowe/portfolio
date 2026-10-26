import { cn } from "@/lib/utils"
import type { Player } from "~firebase/types"
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

export function PlayerIcon({ player, size = "xs" }: { player: Pick<Player, "slug" | "name">; size?: "xs" | "sm" | "md" }) {
    return (
        <IconTile
            label={player.name}
            initials={playerInitials(player.name)}
            size={size}
            className={cn("rounded-full", size === "xs" && "text-[0.6rem]")}
        />
    )
}
