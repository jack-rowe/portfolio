export type Color = "white" | "black";

export type PieceCode =
  | "P"
  | "N"
  | "B"
  | "R"
  | "Q"
  | "K"
  | "p"
  | "n"
  | "b"
  | "r"
  | "q"
  | "k";

export interface CastlingRights {
  K: boolean;
  Q: boolean;
  k: boolean;
  q: boolean;
}

export interface SquareData {
  square: number; // 0-63
  algebraic: string; // "e4"
  piece: PieceCode | null;
  pieceColor: Color | null;
  isLight: boolean; // square color
  file: number; // 0-7
  rank: number; // 0-7
  glow: string | null; // CSS color for piece outline, null = none
  highlight: string | null; // CSS color for square background override, null = none
  isSelected: boolean; // square is the currently selected square
}

export interface RenderState {
  squares: SquareData[]; // always length 64, index = square
  turn: Color;
  fen: string;
  castlingRights: CastlingRights;
  enPassantSquare: string | null; // algebraic or null
  halfmoveClock: number;
  fullmoveNumber: number;
  selectedSquare: number | null;
}
