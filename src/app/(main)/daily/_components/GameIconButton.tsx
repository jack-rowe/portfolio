import type { Game } from "~firebase/types"
import { GAME_ICONS } from "../types"
import { IconButton, IconButtonProps, IconTile } from "./IconButton"

type Props = Omit<IconButtonProps, "src" | "label"> & {
    game: Pick<Game, "slug" | "name">
}

export function GameIconButton({ game, showLabel = true, ...props }: Props) {
    return <IconButton src={GAME_ICONS[game.slug]} label={game.name} showLabel={showLabel} {...props} />
}

export function GameIcon({ game, size = "sm" }: { game: Pick<Game, "slug" | "name">; size?: "xs" | "sm" | "md" }) {
    return <IconTile src={GAME_ICONS[game.slug]} label={game.name} size={size} />
}
