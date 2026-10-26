import { cn } from "@/lib/utils"
import Image from "next/image"

const SIZES = {
    xs: { className: "h-6 w-6 text-xs", px: 24 },
    sm: { className: "h-8 w-8 text-sm", px: 32 },
    md: { className: "h-12 w-12 text-xl", px: 48 },
}

export type IconButtonSize = keyof typeof SIZES

type IconTileProps = {
    src?: string
    label: string
    size?: IconButtonSize
    className?: string
    imageClassName?: string
    /** Replaces the image or initial, e.g. a "+" icon. */
    icon?: React.ReactNode
    /** Text shown when there's no image. Defaults to the label's first letter. */
    initials?: string
    children?: React.ReactNode
}

/** The square artwork on its own, for rows and tables. Falls back to the label's initial. */
export function IconTile({ src, label, size = "sm", className, imageClassName, icon, initials, children }: IconTileProps) {
    const { className: sizeClassName, px } = SIZES[size]

    return (
        <span
            aria-hidden
            className={cn(
                "relative shrink-0 overflow-hidden border-2 border-primary bg-background rounded-sm flex items-center justify-center",
                sizeClassName,
                className
            )}
        >
            {icon ?? (src ? (
                <Image
                    className={cn("object-contain select-none", imageClassName)}
                    src={src}
                    alt=""
                    fill
                    sizes={`${px}px`}
                    draggable={false}
                />
            ) : (
                <span className="font-clash font-bold tracking-tight text-primary leading-none select-none">
                    {initials ?? label.trim().charAt(0).toUpperCase()}
                </span>
            ))}
            {children}
        </span>
    )
}

export type IconButtonProps = Omit<IconTileProps, "children"> & {
    showLabel?: boolean
    /** Second line under the label, e.g. a score type or "✓ 4/6". */
    sublabel?: React.ReactNode
    selected?: boolean
    /** Highlights the tile for a destructive tap (remove mode). */
    danger?: boolean
    disabled?: boolean
    onClick?: React.MouseEventHandler<HTMLButtonElement>
    /** Overrides the accessible name when the visible label isn't enough. */
    ariaLabel?: string
}

export function IconButton({
    label,
    showLabel = false,
    sublabel,
    selected,
    danger,
    disabled,
    onClick,
    className,
    ariaLabel,
    ...tile
}: IconButtonProps) {
    return (
        <button
            type="button"
            aria-label={ariaLabel ?? label}
            aria-pressed={selected}
            title={showLabel ? undefined : label}
            disabled={disabled}
            className="group flex w-16 flex-col items-center gap-1 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none"
            onClick={onClick}
        >
            <IconTile
                label={label}
                {...tile}
                className={cn(
                    "group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
                    selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    danger && "border-destructive",
                    className
                )}
            >
                <span
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute inset-0 bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-25 group-focus-visible:opacity-25",
                        danger && "bg-destructive opacity-25"
                    )}
                />
            </IconTile>
            {showLabel && <TileCaption label={label} selected={selected} />}
            {sublabel && (
                <span
                    aria-hidden
                    className={cn(
                        "-mt-1 w-full truncate text-center text-[0.65rem] leading-tight",
                        danger ? "text-destructive font-medium" : "text-muted-foreground"
                    )}
                >
                    {sublabel}
                </span>
            )}
        </button>
    )
}

function TileCaption({ label, selected }: { label: string; selected?: boolean }) {
    return (
        <span
            aria-hidden
            className={cn(
                "w-full truncate text-center text-xs leading-tight",
                selected ? "text-foreground font-medium" : "text-muted-foreground"
            )}
        >
            {label}
        </span>
    )
}
