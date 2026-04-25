import {
  ALL_EIGHT,
  DIAGONALS,
  ORTHOGONALS,
  PieceLogic,
  SlidingPiece,
  SteppingPiece,
  colorOf,
  type Delta,
  type MoveContext,
} from "./base";

const L1 = 1;
const L2 = 2;
const NEG1 = -1;
const NEG2 = -2;

const WHITE_PAWN_START_RANK = 1;
const BLACK_PAWN_START_RANK = 6;

class Bishop extends SlidingPiece {
  protected readonly directions = DIAGONALS;
}

class Rook extends SlidingPiece {
  protected readonly directions = ORTHOGONALS;
}

class Queen extends SlidingPiece {
  protected readonly directions = ALL_EIGHT;
}

class Knight extends SteppingPiece {
  protected readonly deltas: readonly Delta[] = [
    [L1, L2],
    [L2, L1],
    [NEG1, L2],
    [NEG2, L1],
    [L1, NEG2],
    [L2, NEG1],
    [NEG1, NEG2],
    [NEG2, NEG1],
  ];
}

class King extends SteppingPiece {
  // Castling not yet handled.
  protected readonly deltas: readonly Delta[] = ALL_EIGHT;
}

class Pawn extends PieceLogic {
  getMoves(ctx: MoveContext): number[] {
    const forward = ctx.color === "white" ? L1 : NEG1;
    const startRank =
      ctx.color === "white" ? WHITE_PAWN_START_RANK : BLACK_PAWN_START_RANK;
    const file = Pawn.fileOf(ctx.from);
    const rank = Pawn.rankOf(ctx.from);
    return [
      ...Pawn.pushMoves(ctx, file, rank, forward, startRank),
      ...Pawn.captureMoves(ctx, file, rank, forward),
    ];
  }

  private static pushMoves(
    ctx: MoveContext,
    file: number,
    rank: number,
    forward: number,
    startRank: number,
  ): number[] {
    const moves: number[] = [];
    const oneRank = rank + forward;
    if (!Pawn.onBoard(file, oneRank)) return moves;
    const oneSq = Pawn.sq(file, oneRank);
    if (ctx.board.getPieceAt(oneSq)) return moves;
    moves.push(oneSq);

    if (rank !== startRank) return moves;
    const twoSq = Pawn.sq(file, rank + forward * L2);
    if (!ctx.board.getPieceAt(twoSq)) moves.push(twoSq);
    return moves;
  }

  private static captureMoves(
    ctx: MoveContext,
    file: number,
    rank: number,
    forward: number,
  ): number[] {
    const moves: number[] = [];
    for (const df of [NEG1, L1] as const) {
      const cf = file + df;
      const cr = rank + forward;
      if (!Pawn.onBoard(cf, cr)) continue;
      const to = Pawn.sq(cf, cr);
      const occupant = ctx.board.getPieceAt(to);
      if (occupant) {
        if (colorOf(occupant) !== ctx.color) moves.push(to);
        continue;
      }
      if (ctx.board.enPassantSquare === to) moves.push(to);
    }
    return moves;
  }
}

/**
 * Registry of piece logic keyed by the lowercase piece letter.
 * Both P/p share the same Pawn instance — color lives in MoveContext.
 */
const REGISTRY = {
  p: new Pawn(),
  n: new Knight(),
  b: new Bishop(),
  r: new Rook(),
  q: new Queen(),
  k: new King(),
} as const;

export function getPieceLogic(pieceLetter: string): PieceLogic | null {
  const key = pieceLetter.toLowerCase() as keyof typeof REGISTRY;
  return REGISTRY[key] ?? null;
}

export { colorOf } from "./base";
