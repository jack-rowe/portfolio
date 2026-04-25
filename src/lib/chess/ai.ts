/* eslint-disable no-magic-numbers */
/**
 * Simple chess AI using minimax with alpha-beta pruning.
 *
 * Evaluation is purely material + piece-square tables, which is enough
 * to give a clear beginner-level opponent without any external libraries.
 */

import type { Color } from "./types";
import { Game } from "./game";

// ── Material values ───────────────────────────────────────────────────

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// ── Piece-square tables (white perspective, rank 0 = rank 1) ─────────
// fmt: 64 values, a1..h1, a2..h2, …, a8..h8

const PST_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5, 5, -5, -10, 0, 0, -10,
  -5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, 5, 10, 25, 25, 10, 5, 5, 10, 10, 20, 30,
  30, 20, 10, 10, 50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0,
];

const PST_KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40, -30,
  5, 10, 15, 15, 10, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 15, 20, 20,
  15, 5, -30, -30, 0, 10, 15, 15, 10, 0, -30, -40, -20, 0, 0, 0, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const PST_BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 5, 0, 0, 0, 0, 5, -10, -10, 10,
  10, 10, 10, 10, 10, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 5, 5, 10, 10, 5,
  5, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10,
  -10, -10, -10, -10, -10, -20,
];

const PST_ROOK = [
  0, 0, 0, 5, 5, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
  5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];

const PST_QUEEN = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 5, 0, 0, 0, 0, -10, -10, 5, 5,
  5, 5, 5, 0, -10, 0, 0, 5, 5, 5, 5, 0, -5, -5, 0, 5, 5, 5, 5, 0, -5, -10, 0, 5,
  5, 5, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10,
  -20,
];

const PST_KING_MID = [
  20, 30, 10, 0, 0, 10, 30, 20, 20, 20, 0, 0, 0, 0, 20, 20, -10, -20, -20, -20,
  -20, -20, -20, -10, -20, -30, -30, -40, -40, -30, -30, -20, -30, -40, -40,
  -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40,
  -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
];

const PST: Record<string, number[]> = {
  p: PST_PAWN,
  n: PST_KNIGHT,
  b: PST_BISHOP,
  r: PST_ROOK,
  q: PST_QUEEN,
  k: PST_KING_MID,
};

// ── Evaluation ────────────────────────────────────────────────────────

/**
 * Static evaluation from white's perspective.
 * Positive = white ahead, negative = black ahead.
 */
function evaluate(game: Game): number {
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const piece = game.getPieceAt(sq);
    if (!piece) continue;
    const lower = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    const matVal = PIECE_VALUE[lower] ?? 0;
    const pst = PST[lower];
    // PST is indexed from white's perspective (rank 0 = rank 1).
    const pstIdx = isWhite ? sq : (7 - Math.floor(sq / 8)) * 8 + (sq % 8);
    const pstVal = pst ? (pst[pstIdx] ?? 0) : 0;
    const pieceScore = matVal + pstVal;
    score += isWhite ? pieceScore : -pieceScore;
  }
  return score;
}

// ── Move ordering: captures first, then rest ──────────────────────────

interface RawMove {
  from: number;
  to: number;
}

function collectMoves(game: Game, color: Color): RawMove[] {
  const captures: RawMove[] = [];
  const quiets: RawMove[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const piece = game.getPieceAt(sq);
    if (!piece) continue;
    const isWhite = piece === piece.toUpperCase();
    if ((color === "white") !== isWhite) continue;
    for (const to of game.getLegalMoves(sq)) {
      const victim = game.getPieceAt(to);
      if (victim) captures.push({ from: sq, to });
      else quiets.push({ from: sq, to });
    }
  }
  return [...captures, ...quiets];
}

// ── Minimax with alpha-beta ───────────────────────────────────────────

const MATE_SCORE = 100_000;
const MAX_DEPTH = 3; // ~depth 3 is plenty for a casual opponent

function searchMax(
  game: Game,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const moves = collectMoves(game, "white");
  let best = -Infinity;
  for (const mv of moves) {
    const fen = game.getFEN();
    game.makeMove(mv.from, mv.to);
    const score = minimax(game, depth - 1, alpha, beta, false);
    game.loadFEN(fen);
    best = Math.max(best, score);
    alpha = Math.max(alpha, best);
    if (beta <= alpha) break;
  }
  return best;
}

function searchMin(
  game: Game,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const moves = collectMoves(game, "black");
  let best = Infinity;
  for (const mv of moves) {
    const fen = game.getFEN();
    game.makeMove(mv.from, mv.to);
    const score = minimax(game, depth - 1, alpha, beta, true);
    game.loadFEN(fen);
    best = Math.min(best, score);
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function minimax(
  game: Game,
  depth: number,
  alpha: number,
  beta: number,
  maximising: boolean,
): number {
  if (game.isCheckmate()) return maximising ? -MATE_SCORE : MATE_SCORE;
  if (game.isStalemate()) return 0;
  if (depth === 0) return evaluate(game);
  return maximising
    ? searchMax(game, depth, alpha, beta)
    : searchMin(game, depth, alpha, beta);
}

// ── Public interface ──────────────────────────────────────────────────

export interface AIMove {
  from: number;
  to: number;
}

/**
 * Pick the best move for the given color using minimax + alpha-beta.
 * Returns null if there are no legal moves (checkmate / stalemate).
 */
export function getBestMove(
  game: Game,
  color: Color,
  depth = MAX_DEPTH,
): AIMove | null {
  const moves = collectMoves(game, color);
  if (moves.length === 0) return null;

  const maximising = color === "white";
  let bestScore = maximising ? -Infinity : Infinity;
  let best: AIMove | null = null;

  // Shuffle to randomise ties (prevents always picking the first move)
  const shuffled = moves.slice().sort(() => Math.random() - 0.5);

  for (const mv of shuffled) {
    const fen = game.getFEN();
    game.makeMove(mv.from, mv.to);
    const score = minimax(game, depth - 1, -Infinity, Infinity, !maximising);
    game.loadFEN(fen);

    const better = maximising ? score > bestScore : score < bestScore;
    if (better) {
      bestScore = score;
      best = mv;
    }
  }
  return best;
}
