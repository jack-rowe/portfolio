"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { PieceCode, PieceInstance, RenderState, SquareData } from "./types";

const LAST_RANK = 7;
const CELL_PCT = 12.5;
const DRAG_THRESHOLD_PX = 6;

const PIECE_SRC: Record<PieceCode, string> = {
    K: "/pieces-basic-svg/king-w.svg",
    Q: "/pieces-basic-svg/queen-w.svg",
    R: "/pieces-basic-svg/rook-w.svg",
    B: "/pieces-basic-svg/bishop-w.svg",
    N: "/pieces-basic-svg/knight-w.svg",
    P: "/pieces-basic-svg/pawn-w.svg",
    k: "/pieces-basic-svg/king-b.svg",
    q: "/pieces-basic-svg/queen-b.svg",
    r: "/pieces-basic-svg/rook-b.svg",
    b: "/pieces-basic-svg/bishop-b.svg",
    n: "/pieces-basic-svg/knight-b.svg",
    p: "/pieces-basic-svg/pawn-b.svg",
};

export interface BoardOverlay {
    id: string;
    /** Squares (0-63) the overlay occupies; bounding box used for positioning. */
    squares: number[];
    content: ReactNode;
    /** Optional className for the overlay container. */
    className?: string;
}

export interface BoardDragStart {
    square: number;
    piece: PieceInstance;
}

export interface BoardMoveAttempt {
    from: number;
    to: number;
    piece: PieceInstance;
}

export interface BoardDragHandlers {
    canStart?: (drag: BoardDragStart) => boolean;
    onDragStart?: (drag: BoardDragStart) => void;
    onDragCancel?: (drag: BoardDragStart) => void;
    onMoveAttempt?: (move: BoardMoveAttempt) => boolean | void;
}

interface ChessBoardProps {
    state: RenderState;
    onSquareClick?: (square: number) => void;
    overlays?: BoardOverlay[];
    dragHandlers?: BoardDragHandlers;
    /** Optional extra className on the outer board. */
    className?: string;
}

function Square({
    data,
    onClick,
    onPointerDown,
}: {
    data: SquareData;
    onClick?: (square: number) => void;
    onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>, square: number) => void;
}) {
    const { isLight, highlight, label, algebraic } = data;
    const bgClass = isLight
        ? "bg-secondary text-secondary-foreground"
        : "bg-primary text-primary-foreground";
    return (
        <div
            data-sq={algebraic}
            className={`relative aspect-square flex items-center justify-center select-none cursor-pointer ${bgClass}`}
            onClick={() => onClick?.(data.square)}
            onPointerDown={(event) => onPointerDown?.(event, data.square)}
        >
            {highlight ? (
                <div
                    className="absolute inset-[10%] rounded-full pointer-events-none opacity-70"
                    style={{ backgroundColor: highlight }}
                />
            ) : null}
            {label ? (
                <span className="absolute inset-x-0 bottom-1 text-center text-[clamp(0.6rem,1.2vw,0.9rem)] font-semibold pointer-events-none opacity-80">
                    {label}
                </span>
            ) : null}
        </div>
    );
}

function PieceImage({
    code,
    glow,
    className,
}: {
    code: PieceCode;
    glow: string | null;
    className?: string;
}) {
    const outlineFilter = glow
        ? `drop-shadow(2px 0 0 ${glow}) drop-shadow(-2px 0 0 ${glow}) drop-shadow(0 2px 0 ${glow}) drop-shadow(0 -2px 0 ${glow})`
        : undefined;
    return (
        <Image
            src={PIECE_SRC[code]}
            alt={code}
            width={64}
            height={64}
            className={className ?? "h-3/4 w-3/4"}
            style={{ filter: outlineFilter }}
            draggable={false}
        />
    );
}

function PieceView({ piece }: { piece: PieceInstance }) {
    const { file, rank, piece: code, glow } = piece;
    const x = file * 100; // % of the wrapper's own width (12.5% of board)
    const y = (LAST_RANK - rank) * 100;
    return (
        <div
            className="absolute top-0 left-0 w-[12.5%] h-[12.5%] flex items-center justify-center pointer-events-none transition-transform duration-700 ease-in-out"
            style={{ transform: `translate(${x}%, ${y}%)` }}
        >
            <PieceImage code={code} glow={glow} />
        </div>
    );
}

/** Resolves which square is being hovered during a drag, or null. Extracted
 *  to a module-level function to keep ChessBoard's cyclomatic complexity within
 *  the lint threshold — add any hover-resolution logic here. */
function resolveHoveredSquare(
    dragging: { targetSquare: number | null; originSquare: number } | null,
    squares: SquareData[],
): SquareData | null {
    if (dragging === null) return null;
    const { targetSquare, originSquare } = dragging;
    if (targetSquare === null || targetSquare === originSquare) return null;
    return squares[targetSquare] ?? null;
}

function OverlayView({ overlay }: { overlay: BoardOverlay }) {
    if (overlay.squares.length === 0) return null;
    const files = overlay.squares.map((s) => s % 8);
    const ranks = overlay.squares.map((s) => Math.floor(s / 8));
    const minFile = Math.min(...files);
    const maxFile = Math.max(...files);
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);
    const left = minFile * CELL_PCT;
    const top = (LAST_RANK - maxRank) * CELL_PCT;
    const width = (maxFile - minFile + 1) * CELL_PCT;
    const height = (maxRank - minRank + 1) * CELL_PCT;
    return (
        <div
            className={`absolute overflow-auto animate-in fade-in slide-in-from-bottom-2 duration-500 ${overlay.className ?? ""}`}
            style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
            }}
        >
            {overlay.content}
        </div>
    );
}

export function ChessBoard({
    state,
    onSquareClick,
    overlays,
    dragHandlers,
    className,
}: ChessBoardProps) {
    const boardRef = useRef<HTMLDivElement | null>(null);
    const suppressClickRef = useRef(false);
    const [pendingDrag, setPendingDrag] = useState<{
        pointerId: number;
        startX: number;
        startY: number;
        originSquare: number;
        piece: PieceInstance;
    } | null>(null);
    const [dragging, setDragging] = useState<{
        pointerId: number;
        originSquare: number;
        piece: PieceInstance;
        x: number;
        y: number;
        targetSquare: number | null;
    } | null>(null);

    const piecesBySquare = new Map(state.pieces.map((piece) => [piece.square, piece]));
    const renderedPieces = dragging
        ? state.pieces.filter((piece) => piece.id !== dragging.piece.id)
        : state.pieces;

    function eventToBoardPoint(event: ReactPointerEvent<HTMLDivElement>) {
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return null;
        return {
            rect,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    function pointToSquare(x: number, y: number, rect: DOMRect) {
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
        const file = Math.min(LAST_RANK, Math.max(0, Math.floor((x / rect.width) * 8)));
        const displayRank = Math.min(LAST_RANK, Math.max(0, Math.floor((y / rect.height) * 8)));
        const rank = LAST_RANK - displayRank;
        return rank * 8 + file;
    }

    function clearPointerState(pointerId?: number) {
        if (
            pointerId !== undefined &&
            boardRef.current?.hasPointerCapture(pointerId)
        ) {
            boardRef.current.releasePointerCapture(pointerId);
        }
        setPendingDrag(null);
        setDragging(null);
    }

    function handleSquarePointerDown(
        event: ReactPointerEvent<HTMLDivElement>,
        square: number,
    ) {
        const piece = piecesBySquare.get(square);
        if (!piece || !dragHandlers) return;
        const dragStart = { square, piece };
        if (dragHandlers.canStart && !dragHandlers.canStart(dragStart)) return;
        event.preventDefault();
        boardRef.current?.setPointerCapture(event.pointerId);
        setPendingDrag({
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originSquare: square,
            piece,
        });
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        if (pendingDrag?.pointerId !== event.pointerId) return;

        const point = eventToBoardPoint(event);
        if (!point) return;

        const distance = Math.hypot(
            event.clientX - pendingDrag.startX,
            event.clientY - pendingDrag.startY,
        );

        if (!dragging) {
            if (distance < DRAG_THRESHOLD_PX) return;
            dragHandlers?.onDragStart?.({
                square: pendingDrag.originSquare,
                piece: pendingDrag.piece,
            });
            setDragging({
                pointerId: pendingDrag.pointerId,
                originSquare: pendingDrag.originSquare,
                piece: pendingDrag.piece,
                x: point.x,
                y: point.y,
                targetSquare: pointToSquare(point.x, point.y, point.rect),
            });
            return;
        }

        setDragging({
            ...dragging,
            x: point.x,
            y: point.y,
            targetSquare: pointToSquare(point.x, point.y, point.rect),
        });
    }

    function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
        if (pendingDrag?.pointerId !== event.pointerId) return;
        if (dragging) {
            dragHandlers?.onDragCancel?.({
                square: dragging.originSquare,
                piece: dragging.piece,
            });
        }
        clearPointerState(event.pointerId);
    }

    function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
        if (pendingDrag?.pointerId !== event.pointerId) return;

        suppressClickRef.current = true;
        globalThis.setTimeout(() => {
            suppressClickRef.current = false;
        }, 0);

        if (!dragging) {
            clearPointerState(event.pointerId);
            onSquareClick?.(pendingDrag.originSquare);
            return;
        }

        const move =
            dragging.targetSquare !== null && dragging.targetSquare !== dragging.originSquare
                ? dragHandlers?.onMoveAttempt?.({
                    from: dragging.originSquare,
                    to: dragging.targetSquare,
                    piece: dragging.piece,
                }) === true
                : false;

        if (!move) {
            dragHandlers?.onDragCancel?.({
                square: dragging.originSquare,
                piece: dragging.piece,
            });
        }

        clearPointerState(event.pointerId);
    }

    const hoveredSquare = resolveHoveredSquare(dragging, state.squares);

    const rows: React.ReactElement[] = [];
    for (let rank = 7; rank >= 0; rank--) {
        const rowSquares = state.squares.filter((sq) => sq.rank === rank);
        rows.push(
            <div key={rank} className="contents">
                {rowSquares.map((sq) => (
                    <Square
                        key={sq.algebraic}
                        data={sq}
                        onClick={(square) => {
                            if (suppressClickRef.current) return;
                            onSquareClick?.(square);
                        }}
                        onPointerDown={handleSquarePointerDown}
                    />
                ))}
            </div>,
        );
    }

    return (
        <div
            ref={boardRef}
            className={`relative grid grid-cols-8 w-full max-w-[min(80vw,80vh)] aspect-square border border-border rounded overflow-hidden ${className ?? ""}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={{ touchAction: dragHandlers ? "none" : undefined }}
        >
            {rows}
            <div className="absolute inset-0 pointer-events-none">
                {renderedPieces.map((p) => (
                    <PieceView key={p.id} piece={p} />
                ))}
            </div>
            {hoveredSquare ? (
                <div
                    className="absolute pointer-events-none border-2 rounded-sm"
                    style={{
                        left: `${hoveredSquare.file * CELL_PCT}%`,
                        top: `${(LAST_RANK - hoveredSquare.rank) * CELL_PCT}%`,
                        width: `${CELL_PCT}%`,
                        height: `${CELL_PCT}%`,
                        borderColor: hoveredSquare.highlight ?? "#f8fafc",
                    }}
                />
            ) : null}
            {dragging ? (
                <div
                    className="absolute top-0 left-0 pointer-events-none z-10"
                    style={{
                        width: `${CELL_PCT}%`,
                        height: `${CELL_PCT}%`,
                        transform: `translate(calc(${dragging.x}px - 50%), calc(${dragging.y}px - 50%))`,
                    }}
                >
                    <div className="flex h-full w-full items-center justify-center opacity-90 drop-shadow-lg">
                        <PieceImage code={dragging.piece.piece} glow={dragging.piece.glow} />
                    </div>
                </div>
            ) : null}
            {overlays?.map((o) => (
                <OverlayView key={o.id} overlay={o} />
            ))}
        </div>
    );
}
