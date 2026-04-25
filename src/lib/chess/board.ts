import BitBoard from "./bitboard";
import type { Color, PieceCode, CastlingRights } from "./types";

const PIECE_KEYS: readonly PieceCode[] = [
  "P",
  "N",
  "B",
  "R",
  "Q",
  "K",
  "p",
  "n",
  "b",
  "r",
  "q",
  "k",
];

const START: Record<PieceCode, string> = {
  R: "0000000000000000000000000000000000000000000000000000000010000001",
  N: "0000000000000000000000000000000000000000000000000000000001000010",
  B: "0000000000000000000000000000000000000000000000000000000000100100",
  Q: "0000000000000000000000000000000000000000000000000000000000001000",
  K: "0000000000000000000000000000000000000000000000000000000000010000",
  P: "0000000000000000000000000000000000000000000000001111111100000000",
  r: "1000000100000000000000000000000000000000000000000000000000000000",
  n: "0100001000000000000000000000000000000000000000000000000000000000",
  b: "0010010000000000000000000000000000000000000000000000000000000000",
  q: "0000100000000000000000000000000000000000000000000000000000000000",
  k: "0001000000000000000000000000000000000000000000000000000000000000",
  p: "0000000011111111000000000000000000000000000000000000000000000000",
};

export class Board {
  private pieces: Record<PieceCode, BitBoard>;
  private whiteOcc: BitBoard;
  private blackOcc: BitBoard;
  private allOcc: BitBoard;

  turn: Color;
  castlingRights: CastlingRights;
  enPassantSquare: number | null;
  halfmoveClock: number;
  fullmoveNumber: number;

  constructor(fen?: string) {
    this.pieces = {} as Record<PieceCode, BitBoard>;
    for (const k of PIECE_KEYS) this.pieces[k] = new BitBoard();
    this.whiteOcc = new BitBoard();
    this.blackOcc = new BitBoard();
    this.allOcc = new BitBoard();
    this.turn = "white";
    this.castlingRights = { K: true, Q: true, k: true, q: true };
    this.enPassantSquare = null;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;

    if (fen) {
      this.loadFEN(fen);
    } else {
      this.setupStart();
    }
  }

  // ── Setup ──────────────────────────────────────────────

  private setupStart(): void {
    for (const k of PIECE_KEYS) {
      this.pieces[k] = new BitBoard(START[k]);
    }
    this.refreshOccupancy();
  }

  private refreshOccupancy(): void {
    this.whiteOcc = new BitBoard();
    this.blackOcc = new BitBoard();
    for (const k of PIECE_KEYS) {
      if (k === k.toUpperCase()) {
        this.whiteOcc = this.whiteOcc.or(this.pieces[k]);
      } else {
        this.blackOcc = this.blackOcc.or(this.pieces[k]);
      }
    }
    this.allOcc = this.whiteOcc.or(this.blackOcc);
  }

  // ── Square access ─────────────────────────────────────

  getPieceAt(sq: number): PieceCode | null {
    if (sq < 0 || sq >= 64) return null;
    for (const k of PIECE_KEYS) {
      if (this.pieces[k].getIndex(sq)) return k;
    }
    return null;
  }

  setPieceAt(sq: number, piece: PieceCode | null): void {
    if (sq < 0 || sq >= 64) return;
    this.clearSquare(sq);
    if (piece) this.pieces[piece].orNumber(sq, 1, true);
    this.refreshOccupancy();
  }

  private clearSquare(sq: number): void {
    const mask = new BitBoard().orNumber(sq, 1).not();
    for (const k of PIECE_KEYS) {
      this.pieces[k] = this.pieces[k].and(mask);
    }
  }

  // ── Bitboard getters ──────────────────────────────────

  getBitboard(piece: PieceCode): BitBoard {
    return this.pieces[piece];
  }

  getOccupancy(color?: Color): BitBoard {
    if (color === "white") return this.whiteOcc.copy();
    if (color === "black") return this.blackOcc.copy();
    return this.allOcc.copy();
  }

  // ── Render state (plain objects for React) ────────────
  // Note: Game now composes its own RenderState (with glows/highlights/
  // labels/piece-ids). Board intentionally no longer builds one.

  // ── FEN ───────────────────────────────────────────────

  loadFEN(fen: string): void {
    const parts = fen.split(" ");
    for (const k of PIECE_KEYS) this.pieces[k] = new BitBoard();

    const ranks = parts[0].split("/");
    let sq = 56; // a8
    for (const rank of ranks) {
      for (const ch of rank) {
        if (ch >= "1" && ch <= "8") {
          sq += Number.parseInt(ch);
        } else {
          this.pieces[ch as PieceCode].orNumber(sq, 1, true);
          sq++;
        }
      }
      sq -= 16;
    }

    this.turn = parts[1] === "w" ? "white" : "black";

    const c = parts[2] ?? "-";
    this.castlingRights = {
      K: c.includes("K"),
      Q: c.includes("Q"),
      k: c.includes("k"),
      q: c.includes("q"),
    };

    this.enPassantSquare =
      parts[3] && parts[3] !== "-" ? Board.toSquare(parts[3]) : null;
    this.halfmoveClock = parts[4] ? Number.parseInt(parts[4]) : 0;
    this.fullmoveNumber = parts[5] ? Number.parseInt(parts[5]) : 1;

    this.refreshOccupancy();
  }

  toFEN(): string {
    let pos = "";
    for (let rank = 7; rank >= 0; rank--) {
      let empty = 0;
      for (let file = 0; file < 8; file++) {
        const piece = this.getPieceAt(rank * 8 + file);
        if (piece) {
          if (empty) {
            pos += empty;
            empty = 0;
          }
          pos += piece;
        } else {
          empty++;
        }
      }
      if (empty) pos += empty;
      if (rank > 0) pos += "/";
    }

    const cr = this.castlingRights;
    const castling =
      (cr.K ? "K" : "") +
        (cr.Q ? "Q" : "") +
        (cr.k ? "k" : "") +
        (cr.q ? "q" : "") || "-";
    const ep =
      this.enPassantSquare !== null
        ? Board.toAlgebraic(this.enPassantSquare)
        : "-";

    return `${pos} ${this.turn === "white" ? "w" : "b"} ${castling} ${ep} ${this.halfmoveClock} ${this.fullmoveNumber}`;
  }

  // ── Static helpers ────────────────────────────────────

  static toSquare(alg: string): number {
    return (Number.parseInt(alg[1]) - 1) * 8 + (alg.charCodeAt(0) - 97);
  }

  static toAlgebraic(sq: number): string {
    return String.fromCharCode(97 + (sq % 8)) + (Math.floor(sq / 8) + 1);
  }
}
