import { Board } from "./board";
import type { Color, PieceCode, RenderState } from "./types";

export type { Color, PieceCode, RenderState };
export type { SquareData, CastlingRights } from "./types";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export class Game {
  private board: Board;
  private glows = new Map<number, string>();
  private highlights = new Map<number, string>();
  private selectedSquare: number | null = null;

  constructor(fen?: string) {
    this.board = new Board(fen ?? START_FEN);
  }

  /** Plain-object snapshot React can render from. */
  getRenderState(): RenderState {
    return this.board.toRenderState(
      this.glows,
      this.highlights,
      this.selectedSquare,
    );
  }

  /** Current FEN string. */
  getFEN(): string {
    return this.board.toFEN();
  }

  /** Whose turn it is. */
  getTurn(): Color {
    return this.board.turn;
  }

  /** Load an arbitrary position. */
  loadFEN(fen: string): void {
    this.board.loadFEN(fen);
  }

  /** Reset to starting position. */
  reset(): void {
    this.board = new Board(START_FEN);
  }

  /** Read what piece sits on a square (0-63 or algebraic). */
  getPieceAt(sq: number | string): PieceCode | null {
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    return this.board.getPieceAt(idx);
  }

  /** Place or remove a piece (for setup / debugging). */
  setPieceAt(sq: number | string, piece: PieceCode | null): void {
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    this.board.setPieceAt(idx, piece);
  }

  /** Set a glow color on a square (by index or algebraic). */
  setGlow(sq: number | string, color: string): void {
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    this.glows.set(idx, color);
  }

  /** Remove glow from a square. */
  clearGlow(sq: number | string): void {
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    this.glows.delete(idx);
  }

  /** Remove all glows. */
  clearAllGlows(): void {
    this.glows.clear();
  }

  isGlowing(sq: number | string): boolean {
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    return this.glows.has(idx);
  }

  /** Set a highlight color on a square (changes square background). */
  setHighlight(sq: number | string, color: string): void {
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    this.highlights.set(idx, color);
  }

  /** Remove highlight from a square. */
  clearHighlight(sq: number | string): void {
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    this.highlights.delete(idx);
  }

  /** Remove all highlights. */
  clearAllHighlights(): void {
    this.highlights.clear();
  }

  /**
   * Selection: select a square. Glows the piece and highlights its legal
   * moves. Does nothing if the square is empty.
   */
  select(sq: number | string): void {
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    const piece = this.board.getPieceAt(idx);
    if (!piece) return;

    this.deselect();
    this.selectedSquare = idx;
    this.glows.set(idx, "yellow");
    for (const move of this.getLegalMoves(idx)) {
      this.highlights.set(move, "green");
    }
  }

  /** Selection: clear selection and any associated visuals. */
  deselect(): void {
    this.selectedSquare = null;
    this.glows.clear();
    this.highlights.clear();
  }

  /** Selection: get currently selected square (or null). */
  getSelectedSquare(): number | null {
    return this.selectedSquare;
  }

  /**
   * High-level click handler implementing chess.com-style selection:
   * - empty square + no selection → no-op
   * - own piece + no selection → select
   * - same square as selected → deselect
   * - any other square with selection active → deselect (move logic TBD)
   */
  handleSquareClick(sq: number | string): void {
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    const selected = this.selectedSquare;
    const piece = this.board.getPieceAt(idx);

    if (selected === null) {
      if (piece) this.select(idx);
      return;
    }

    if (selected === idx) {
      this.deselect();
      return;
    }

    // TODO: if idx is a legal move, perform it
    this.deselect();
    if (piece) this.select(idx);
  }

  flipBoard(): void {
    const newBoard = new Board();
    for (let sq = 0; sq < 64; sq++) {
      const piece = this.board.getPieceAt(sq);
      if (piece) {
        const flippedSq = 63 - sq;
        newBoard.setPieceAt(flippedSq, piece);
      }
    }
    this.board = newBoard;

    const flippedSelected =
      this.selectedSquare !== null ? 63 - this.selectedSquare : null;
    this.deselect();
    if (flippedSelected !== null) this.select(flippedSelected);
  }

  getLegalMoves(sq: number | string): number[] {
    // Placeholder - king-style adjacency. Reject moves that wrap across files.
    const idx = typeof sq === "string" ? Board.toSquare(sq) : sq;
    const fromFile = idx % 8;
    const fromRank = Math.floor(idx / 8);
    const moves: number[] = [];
    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;
        const toFile = fromFile + df;
        const toRank = fromRank + dr;
        if (toFile < 0 || toFile > 7 || toRank < 0 || toRank > 7) continue;
        moves.push(toRank * 8 + toFile);
      }
    }
    return moves;
  }

  /** Square index ↔ algebraic helpers exposed statically. */
  static toSquare = Board.toSquare;
  static toAlgebraic = Board.toAlgebraic;
}
