import { Board } from "./board";
import { getPieceLogic, colorOf } from "./pieces";
import type {
  Color,
  PieceCode,
  PieceInstance,
  RenderState,
  SquareData,
} from "./types";

export type { Color, PieceCode, RenderState, PieceInstance };
export type { SquareData, CastlingRights } from "./types";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const EMPTY_FEN = "8/8/8/8/8/8/8/8 w - - 0 1";

type SquareRef = number | string;

export interface LayoutEntry {
  id: string;
  piece: PieceCode;
  square: SquareRef;
}

export interface MoveResult {
  ok: boolean;
  captured?: PieceCode | null;
  capturedSquare?: number;
  promoted?: PieceCode;
  castled?: "K" | "Q" | "k" | "q";
}

function toIdx(sq: SquareRef): number {
  return typeof sq === "string" ? Board.toSquare(sq) : sq;
}

export class Game {
  private board: Board;
  private glows = new Map<number, string>();
  private highlights = new Map<number, string>();
  private labels = new Map<number, string>();
  private pieceIds = new Map<number, string>();
  private nextId = 1;
  private selectedSquare: number | null = null;

  constructor(fen?: string) {
    this.board = new Board(fen ?? START_FEN);
    this.rebuildIds();
  }

  // ── Rendering ───────────────────────────────────────────────────────

  getRenderState(): RenderState {
    const squares: SquareData[] = new Array(64);
    for (let sq = 0; sq < 64; sq++) {
      const piece = this.board.getPieceAt(sq);
      const file = sq % 8;
      const rank = Math.floor(sq / 8);
      squares[sq] = {
        square: sq,
        algebraic: Board.toAlgebraic(sq),
        piece,
        pieceColor: piece ? colorOf(piece) : null,
        isLight: (file + rank) % 2 !== 0,
        file,
        rank,
        glow: this.glows.get(sq) ?? null,
        highlight: this.highlights.get(sq) ?? null,
        isSelected: sq === this.selectedSquare,
        label: this.labels.get(sq) ?? null,
      };
    }

    const pieces: PieceInstance[] = [];
    for (const [sq, id] of this.pieceIds) {
      const p = this.board.getPieceAt(sq);
      if (!p) continue;
      pieces.push({
        id,
        piece: p,
        square: sq,
        file: sq % 8,
        rank: Math.floor(sq / 8),
        glow: this.glows.get(sq) ?? null,
      });
    }

    return {
      squares,
      pieces,
      turn: this.board.turn,
      fen: this.board.toFEN(),
      castlingRights: { ...this.board.castlingRights },
      enPassantSquare:
        this.board.enPassantSquare !== null
          ? Board.toAlgebraic(this.board.enPassantSquare)
          : null,
      halfmoveClock: this.board.halfmoveClock,
      fullmoveNumber: this.board.fullmoveNumber,
      selectedSquare: this.selectedSquare,
    };
  }

  getFEN(): string {
    return this.board.toFEN();
  }

  getTurn(): Color {
    return this.board.turn;
  }

  loadFEN(fen: string): void {
    this.board.loadFEN(fen);
    this.rebuildIds();
    this.selectedSquare = null;
    this.glows.clear();
    this.highlights.clear();
  }

  reset(): void {
    this.loadFEN(START_FEN);
  }

  // ── Low-level square access ────────────────────────────────────────

  getPieceAt(sq: SquareRef): PieceCode | null {
    return this.board.getPieceAt(toIdx(sq));
  }

  /** Place or remove a piece (no rules, no turn change). Returns id. */
  setPieceAt(
    sq: SquareRef,
    piece: PieceCode | null,
    id?: string,
  ): string | null {
    const idx = toIdx(sq);
    this.pieceIds.delete(idx);
    this.board.setPieceAt(idx, piece);
    if (piece === null) return null;
    const pid = id ?? this.makeId();
    this.pieceIds.set(idx, pid);
    return pid;
  }

  /** Get the stable piece-instance id at a square. */
  getIdAt(sq: SquareRef): string | null {
    return this.pieceIds.get(toIdx(sq)) ?? null;
  }

  /** Find current square for a given piece id. */
  findId(id: string): number | null {
    for (const [sq, pid] of this.pieceIds) if (pid === id) return sq;
    return null;
  }

  /**
   * Move a piece from → to with no legality check, no turn change, no
   * side effects on castling/en-passant/clocks. Any piece on the
   * destination is removed (captured). Preserves piece id for animation.
   */
  teleport(from: SquareRef, to: SquareRef): boolean {
    const f = toIdx(from);
    const t = toIdx(to);
    if (f === t) return false;
    const piece = this.board.getPieceAt(f);
    if (!piece) return false;
    const id = this.pieceIds.get(f) ?? this.makeId();
    this.pieceIds.delete(f);
    this.pieceIds.delete(t);
    this.board.setPieceAt(f, null);
    this.board.setPieceAt(t, piece);
    this.pieceIds.set(t, id);
    return true;
  }

  /** Clear every piece from the board. */
  clearBoard(): void {
    for (let sq = 0; sq < 64; sq++) this.board.setPieceAt(sq, null);
    this.pieceIds.clear();
    this.selectedSquare = null;
  }

  /**
   * Replace the board with the given layout. Ids in the layout replace
   * the current mapping; pieces whose ids persist will animate from
   * their old square to the new one in the UI.
   */
  setLayout(layout: readonly LayoutEntry[]): void {
    this.board.loadFEN(EMPTY_FEN);
    this.pieceIds.clear();
    this.selectedSquare = null;
    for (const entry of layout) {
      const idx = toIdx(entry.square);
      this.board.setPieceAt(idx, entry.piece);
      this.pieceIds.set(idx, entry.id);
    }
  }

  // ── Visual helpers ─────────────────────────────────────────────────

  setGlow(sq: SquareRef, color: string): void {
    this.glows.set(toIdx(sq), color);
  }
  clearGlow(sq: SquareRef): void {
    this.glows.delete(toIdx(sq));
  }
  clearAllGlows(): void {
    this.glows.clear();
  }
  isGlowing(sq: SquareRef): boolean {
    return this.glows.has(toIdx(sq));
  }

  setHighlight(sq: SquareRef, color: string): void {
    this.highlights.set(toIdx(sq), color);
  }
  clearHighlight(sq: SquareRef): void {
    this.highlights.delete(toIdx(sq));
  }
  clearAllHighlights(): void {
    this.highlights.clear();
  }

  setLabel(sq: SquareRef, text: string): void {
    this.labels.set(toIdx(sq), text);
  }
  clearLabel(sq: SquareRef): void {
    this.labels.delete(toIdx(sq));
  }
  clearAllLabels(): void {
    this.labels.clear();
  }

  // ── Selection ──────────────────────────────────────────────────────

  select(sq: SquareRef): void {
    const idx = toIdx(sq);
    const piece = this.board.getPieceAt(idx);
    if (!piece) return;
    this.deselect();
    this.selectedSquare = idx;
    this.glows.set(idx, "yellow");
    for (const move of this.getLegalMoves(idx)) {
      this.highlights.set(move, "green");
    }
  }

  deselect(): void {
    this.selectedSquare = null;
    this.glows.clear();
    this.highlights.clear();
  }

  getSelectedSquare(): number | null {
    return this.selectedSquare;
  }

  /**
   * chess.com-style click handler: selects own pieces, deselects on
   * repeat, and makes legal moves when clicking a legal destination.
   * Returns true if a move was actually played.
   */
  handleSquareClick(sq: SquareRef): boolean {
    const idx = toIdx(sq);
    const selected = this.selectedSquare;
    const piece = this.board.getPieceAt(idx);

    if (selected === null) {
      if (piece && colorOf(piece) === this.board.turn) this.select(idx);
      return false;
    }

    if (selected === idx) {
      this.deselect();
      return false;
    }

    const legal = this.getLegalMoves(selected);
    if (legal.includes(idx)) {
      const result = this.makeMove(selected, idx);
      return result.ok;
    }

    this.deselect();
    if (piece && colorOf(piece) === this.board.turn) this.select(idx);
    return false;
  }

  // ── Legal move generation ──────────────────────────────────────────

  /** Fully legal moves (filters king safety; includes castling). */
  getLegalMoves(sq: SquareRef): number[] {
    const from = toIdx(sq);
    const piece = this.board.getPieceAt(from);
    if (!piece) return [];
    const color = colorOf(piece);
    const pseudo = this.getPseudoLegalMoves(from);
    const legal: number[] = [];
    for (const to of pseudo) {
      if (!this.moveLeavesKingInCheck(from, to, color)) legal.push(to);
    }
    if (piece.toLowerCase() === "k") {
      for (const c of this.getCastleTargets(from, color)) legal.push(c);
    }
    return legal;
  }

  private getPseudoLegalMoves(from: number): number[] {
    const piece = this.board.getPieceAt(from);
    if (!piece) return [];
    const logic = getPieceLogic(piece);
    if (!logic) return [];
    return logic.getMoves({
      board: this.board,
      from,
      color: colorOf(piece),
    });
  }

  /** Squares this piece attacks (for pawns: diagonals only). */
  private getAttackTargets(from: number): number[] {
    const piece = this.board.getPieceAt(from);
    if (!piece) return [];
    if (piece.toLowerCase() === "p") {
      const color = colorOf(piece);
      const forward = color === "white" ? 1 : -1;
      const f = from % 8;
      const r = Math.floor(from / 8);
      const result: number[] = [];
      for (const df of [-1, 1]) {
        const nf = f + df;
        const nr = r + forward;
        if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
          result.push(nr * 8 + nf);
        }
      }
      return result;
    }
    return this.getPseudoLegalMoves(from);
  }

  private isSquareAttacked(sq: number, byColor: Color): boolean {
    for (let s = 0; s < 64; s++) {
      const p = this.board.getPieceAt(s);
      if (!p || colorOf(p) !== byColor) continue;
      if (this.getAttackTargets(s).includes(sq)) return true;
    }
    return false;
  }

  private findKing(color: Color): number {
    const kp: PieceCode = color === "white" ? "K" : "k";
    for (let s = 0; s < 64; s++) {
      if (this.board.getPieceAt(s) === kp) return s;
    }
    return -1;
  }

  isInCheck(color: Color = this.board.turn): boolean {
    const k = this.findKing(color);
    if (k < 0) return false;
    return this.isSquareAttacked(k, color === "white" ? "black" : "white");
  }

  isCheckmate(): boolean {
    if (!this.isInCheck(this.board.turn)) return false;
    return !this.hasAnyLegalMove(this.board.turn);
  }

  isStalemate(): boolean {
    if (this.isInCheck(this.board.turn)) return false;
    return !this.hasAnyLegalMove(this.board.turn);
  }

  private hasAnyLegalMove(color: Color): boolean {
    for (let s = 0; s < 64; s++) {
      const p = this.board.getPieceAt(s);
      if (!p || colorOf(p) !== color) continue;
      if (this.getLegalMoves(s).length > 0) return true;
    }
    return false;
  }

  private moveLeavesKingInCheck(
    from: number,
    to: number,
    color: Color,
  ): boolean {
    const fen = this.board.toFEN();
    const piece = this.board.getPieceAt(from);
    if (!piece) return true;
    const isPawn = piece.toLowerCase() === "p";

    if (
      isPawn &&
      to === this.board.enPassantSquare &&
      !this.board.getPieceAt(to)
    ) {
      const capSq = to + (color === "white" ? -8 : 8);
      this.board.setPieceAt(capSq, null);
    }
    this.board.setPieceAt(from, null);
    this.board.setPieceAt(to, piece);

    const inCheck = this.isInCheck(color);
    this.board.loadFEN(fen);
    return inCheck;
  }

  private getCastleTargets(from: number, color: Color): number[] {
    const result: number[] = [];
    const rank = color === "white" ? 0 : 7;
    if (from !== rank * 8 + 4) return result;
    if (this.isInCheck(color)) return result;
    const enemy: Color = color === "white" ? "black" : "white";
    const rights = this.board.castlingRights;

    const canK = color === "white" ? rights.K : rights.k;
    if (canK) {
      const f5 = rank * 8 + 5;
      const f6 = rank * 8 + 6;
      if (
        !this.board.getPieceAt(f5) &&
        !this.board.getPieceAt(f6) &&
        !this.isSquareAttacked(f5, enemy) &&
        !this.isSquareAttacked(f6, enemy)
      ) {
        result.push(f6);
      }
    }
    const canQ = color === "white" ? rights.Q : rights.q;
    if (canQ) {
      const f1 = rank * 8 + 1;
      const f2 = rank * 8 + 2;
      const f3 = rank * 8 + 3;
      if (
        !this.board.getPieceAt(f1) &&
        !this.board.getPieceAt(f2) &&
        !this.board.getPieceAt(f3) &&
        !this.isSquareAttacked(f2, enemy) &&
        !this.isSquareAttacked(f3, enemy)
      ) {
        result.push(f2);
      }
    }
    return result;
  }

  // ── Making a legal move ────────────────────────────────────────────

  /**
   * Play a fully-legal move. Returns info about what happened.
   * `promotion` is a piece letter ("q","r","b","n"); case is ignored.
   * Defaults to queen.
   */
  makeMove(from: SquareRef, to: SquareRef, promotion?: string): MoveResult {
    const f = toIdx(from);
    const t = toIdx(to);
    const piece = this.board.getPieceAt(f);
    if (!piece) return { ok: false };
    const color = colorOf(piece);
    if (color !== this.board.turn) return { ok: false };

    const legal = this.getLegalMoves(f);
    if (!legal.includes(t)) return { ok: false };

    const result: MoveResult = { ok: true, captured: null };
    const isPawn = piece.toLowerCase() === "p";
    const isKing = piece.toLowerCase() === "k";
    const fromFile = f % 8;
    const fromRank = Math.floor(f / 8);
    const toFile = t % 8;
    const toRank = Math.floor(t / 8);

    // En-passant capture
    let capturedSq = t;
    let captured: PieceCode | null = this.board.getPieceAt(t);
    if (isPawn && t === this.board.enPassantSquare && !captured) {
      capturedSq = t + (color === "white" ? -8 : 8);
      captured = this.board.getPieceAt(capturedSq);
      this.board.setPieceAt(capturedSq, null);
      this.pieceIds.delete(capturedSq);
    } else if (captured) {
      this.pieceIds.delete(t);
    }
    if (captured) {
      result.captured = captured;
      result.capturedSquare = capturedSq;
    }

    // Promotion
    let finalPiece: PieceCode = piece;
    if (isPawn && (toRank === 0 || toRank === 7)) {
      const letter = (promotion ?? "q").toLowerCase();
      const allowed = ["q", "r", "b", "n"];
      const pick = allowed.includes(letter) ? letter : "q";
      finalPiece = (color === "white" ? pick.toUpperCase() : pick) as PieceCode;
      result.promoted = finalPiece;
    }

    // Move the piece (preserve id)
    const id = this.pieceIds.get(f) ?? this.makeId();
    this.pieceIds.delete(f);
    this.board.setPieceAt(f, null);
    this.board.setPieceAt(t, finalPiece);
    this.pieceIds.set(t, id);

    // Castle: move the rook too
    if (isKing && Math.abs(fromFile - toFile) === 2) {
      const rank = fromRank;
      const kingside = toFile === 6;
      const rookFrom = rank * 8 + (kingside ? 7 : 0);
      const rookTo = rank * 8 + (kingside ? 5 : 3);
      const rookPiece = this.board.getPieceAt(rookFrom);
      if (rookPiece) {
        const rookId = this.pieceIds.get(rookFrom) ?? this.makeId();
        this.pieceIds.delete(rookFrom);
        this.board.setPieceAt(rookFrom, null);
        this.board.setPieceAt(rookTo, rookPiece);
        this.pieceIds.set(rookTo, rookId);
      }
      result.castled =
        color === "white" ? (kingside ? "K" : "Q") : kingside ? "k" : "q";
    }

    // Update castling rights
    const cr = this.board.castlingRights;
    if (isKing) {
      if (color === "white") {
        cr.K = false;
        cr.Q = false;
      } else {
        cr.k = false;
        cr.q = false;
      }
    }
    if (piece === "R") {
      if (f === 0) cr.Q = false;
      if (f === 7) cr.K = false;
    }
    if (piece === "r") {
      if (f === 56) cr.q = false;
      if (f === 63) cr.k = false;
    }
    if (captured === "R") {
      if (capturedSq === 0) cr.Q = false;
      if (capturedSq === 7) cr.K = false;
    }
    if (captured === "r") {
      if (capturedSq === 56) cr.q = false;
      if (capturedSq === 63) cr.k = false;
    }

    // En-passant square
    if (isPawn && Math.abs(fromRank - toRank) === 2) {
      this.board.enPassantSquare = (f + t) / 2;
    } else {
      this.board.enPassantSquare = null;
    }

    // Halfmove / fullmove
    if (isPawn || captured) this.board.halfmoveClock = 0;
    else this.board.halfmoveClock += 1;
    if (this.board.turn === "black") this.board.fullmoveNumber += 1;

    // Flip turn & clear selection UI
    this.board.turn = color === "white" ? "black" : "white";
    this.deselect();
    return result;
  }

  // ── Misc ───────────────────────────────────────────────────────────

  flipBoard(): void {
    const newBoard = new Board(EMPTY_FEN);
    const newIds = new Map<number, string>();
    for (let sq = 0; sq < 64; sq++) {
      const piece = this.board.getPieceAt(sq);
      if (piece) {
        const flipped = 63 - sq;
        newBoard.setPieceAt(flipped, piece);
        const id = this.pieceIds.get(sq);
        if (id !== undefined) newIds.set(flipped, id);
      }
    }
    this.board = newBoard;
    this.pieceIds = newIds;
    this.deselect();
  }

  // ── Internals ──────────────────────────────────────────────────────

  private makeId(): string {
    return `piece_${this.nextId++}`;
  }

  private rebuildIds(): void {
    this.pieceIds.clear();
    for (let sq = 0; sq < 64; sq++) {
      if (this.board.getPieceAt(sq)) {
        this.pieceIds.set(sq, this.makeId());
      }
    }
  }

  static toSquare = Board.toSquare;
  static toAlgebraic = Board.toAlgebraic;
}
