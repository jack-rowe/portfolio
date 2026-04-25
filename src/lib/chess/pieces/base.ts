import type { Board } from "../board";
import type { Color, PieceCode } from "../types";

export type Delta = readonly [number, number];

export const BOARD_MIN = 0;
export const BOARD_MAX = 7;
export const FILES = 8;

export interface MoveContext {
  board: Board;
  from: number;
  color: Color;
}

export function colorOf(piece: PieceCode): Color {
  return piece === piece.toUpperCase() ? "white" : "black";
}

/**
 * Base class for piece movement logic.
 * Subclasses override `getMoves` (or use one of the helper subclasses below).
 * Shared geometry/occupancy helpers live here so every piece can use them.
 */
export abstract class PieceLogic {
  abstract getMoves(ctx: MoveContext): number[];

  protected static fileOf(sq: number): number {
    return sq % FILES;
  }

  protected static rankOf(sq: number): number {
    return Math.floor(sq / FILES);
  }

  protected static sq(file: number, rank: number): number {
    return rank * FILES + file;
  }

  protected static onBoard(file: number, rank: number): boolean {
    return (
      file >= BOARD_MIN &&
      file <= BOARD_MAX &&
      rank >= BOARD_MIN &&
      rank <= BOARD_MAX
    );
  }

  /**
   * Slide along each direction until blocked.
   * Empty squares are legal. Enemy piece is a legal capture then stop.
   * Own piece blocks (not added).
   */
  protected slide(ctx: MoveContext, directions: readonly Delta[]): number[] {
    const moves: number[] = [];
    const f0 = PieceLogic.fileOf(ctx.from);
    const r0 = PieceLogic.rankOf(ctx.from);
    for (const [df, dr] of directions) {
      let f = f0 + df;
      let r = r0 + dr;
      while (PieceLogic.onBoard(f, r)) {
        const to = PieceLogic.sq(f, r);
        const occupant = ctx.board.getPieceAt(to);
        if (occupant) {
          if (colorOf(occupant) !== ctx.color) moves.push(to);
          break;
        }
        moves.push(to);
        f += df;
        r += dr;
      }
    }
    return moves;
  }

  /**
   * One-step moves by a fixed list of deltas.
   * Rejects off-board and own-color squares. Enemy squares are captures.
   */
  protected step(ctx: MoveContext, deltas: readonly Delta[]): number[] {
    const moves: number[] = [];
    const f0 = PieceLogic.fileOf(ctx.from);
    const r0 = PieceLogic.rankOf(ctx.from);
    for (const [df, dr] of deltas) {
      const f = f0 + df;
      const r = r0 + dr;
      if (!PieceLogic.onBoard(f, r)) continue;
      const to = PieceLogic.sq(f, r);
      const occupant = ctx.board.getPieceAt(to);
      if (!occupant || colorOf(occupant) !== ctx.color) moves.push(to);
    }
    return moves;
  }
}

/** Any piece whose moves are a fixed set of directions slid to the edge. */
export abstract class SlidingPiece extends PieceLogic {
  protected abstract readonly directions: readonly Delta[];

  getMoves(ctx: MoveContext): number[] {
    return this.slide(ctx, this.directions);
  }
}

/** Any piece whose moves are a fixed set of single-step deltas. */
export abstract class SteppingPiece extends PieceLogic {
  protected abstract readonly deltas: readonly Delta[];

  getMoves(ctx: MoveContext): number[] {
    return this.step(ctx, this.deltas);
  }
}

export const ORTHOGONALS: readonly Delta[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export const DIAGONALS: readonly Delta[] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

export const ALL_EIGHT: readonly Delta[] = [...ORTHOGONALS, ...DIAGONALS];
