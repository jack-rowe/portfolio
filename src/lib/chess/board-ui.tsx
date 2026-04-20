"use client";

import Image from "next/image";
import type { RenderState, SquareData } from "./types";

const PIECE_SRC: Record<string, string> = {
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

function Square({ data, onClick }: { data: SquareData; onClick?: (square: number) => void }) {
    const { algebraic, piece, isLight, glow, highlight } = data;
    const outlineFilter = glow
        ? `drop-shadow(2px 0 0 ${glow}) drop-shadow(-2px 0 0 ${glow}) drop-shadow(0 2px 0 ${glow}) drop-shadow(0 -2px 0 ${glow})`
        : undefined;
    const bgClass = isLight ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground";
    return (
        <div
            key={algebraic}
            className={`relative aspect-square flex items-center justify-center text-[clamp(1.5rem,5vw,3.5rem)] select-none cursor-pointer ${bgClass}`}
            onClick={() => onClick?.(data.square)}
        >
            {highlight ? (
                <div
                    className="absolute inset-[10%] rounded-full pointer-events-none opacity-70"
                    style={{ backgroundColor: highlight }}
                />
            ) : null}
            {piece ? (
                <Image
                    src={PIECE_SRC[piece]}
                    alt={piece}
                    width={64}
                    height={64}
                    className="relative h-3/4 w-3/4 pointer-events-none"
                    style={{ filter: outlineFilter }}
                    draggable={false}
                />
            ) : null}
        </div>
    );
}

export function ChessBoard({ state, onSquareClick }: { state: RenderState; onSquareClick?: (square: number) => void }) {
    const { squares } = state;
    const rows = [];
    for (let rank = 7; rank >= 0; rank--) {
        const rowSquares = squares.filter((sq) => sq.rank === rank);
        rows.push(
            <div key={rank} className="contents">
                {rowSquares.map((sq) => (
                    <Square key={sq.algebraic} data={sq} onClick={onSquareClick} />
                ))}
            </div>,
        );
    }
    return (
        <div
            className="grid grid-cols-8 w-full max-w-[min(80vw,80vh)] aspect-square border border-border rounded overflow-hidden"
        >
            {rows}
        </div>
    );
}
