"use client";
import { Button } from "@/components/ui/button";
import { ChessBoard } from "@/lib/chess/board-ui";
import type { RenderState } from "@/lib/chess/game";
import { Game } from "@/lib/chess/game";
import { useCallback, useRef, useState } from "react";
export default function ChessPage() {
    const gameRef = useRef(new Game());
    const game = gameRef.current;
    const [state, setState] = useState<RenderState>(() => game.getRenderState());

    const sync = useCallback(() => setState(game.getRenderState()), [game]);

    const handleSquareClick = useCallback((square: number) => {
        game.handleSquareClick(square);
        sync();
    }, [game, sync]);

    return (
        <div className="font-clash relative min-h-screen flex items-center justify-center px-4">
            <div className="flex flex-col items-center w-full">
                <ChessBoard state={state} onSquareClick={handleSquareClick} />
                <Button className="mt-6" onClick={() => {
                    game.flipBoard();
                    sync();
                }}>
                    Flip Board
                </Button>
            </div>
        </div>
    );
}