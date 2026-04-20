/* eslint-disable no-magic-numbers */

const BITS_PER_BUCKET = 32;
const MAX_BITS = 0x100000000; // 2 ** 32
const BOARD_LENGTH = 64;
const UINT32_MASK = 0xffffffff; // 2 ** 32 - 1

// Masks for flipVertical
const FLIP_V_MASK_1: [number, number] = [0x00ff00ff, 0x00ff00ff];
const FLIP_V_MASK_2: [number, number] = [0x0000ffff, 0x0000ffff];

// Masks for flipDiagonal
const FLIP_D_MASK_1: [number, number] = [0xaa00aa00, 0xaa00aa00];
const FLIP_D_MASK_2: [number, number] = [0xcccc0000, 0xcccc0000];
const FLIP_D_MASK_4: [number, number] = [0xf0f0f0f0, 0x0f0f0f0f];

// Masks for rotate180
const ROT_MASK_H1: [number, number] = [0x55555555, 0x55555555];
const ROT_MASK_H2: [number, number] = [0x33333333, 0x33333333];
const ROT_MASK_H4: [number, number] = [0x0f0f0f0f, 0x0f0f0f0f];
const ROT_MASK_V1: [number, number] = [0x00ff00ff, 0x00ff00ff];
const ROT_MASK_V2: [number, number] = [0x0000ffff, 0x0000ffff];

class BitBoard {
  public board: number[] = [0, 0];
  public readonly length = BOARD_LENGTH;

  constructor(board?: number[] | string) {
    if (!board) {
      return;
    }

    if (typeof board === "string") {
      this.initFromString(board);
    } else if (Array.isArray(board)) {
      this.initFromArray(board);
    } else {
      throw new TypeError("Input must be a string or number array");
    }
  }

  private initFromString(board: string): void {
    if (
      board.length > BOARD_LENGTH ||
      [...board].some((ch) => !["0", "1"].includes(ch))
    ) {
      throw new SyntaxError(
        "Inputs to board as a string must be between 1 and 64 zeroes and ones.",
      );
    }

    const left =
      board.length > BITS_PER_BUCKET
        ? Number.parseInt(board.slice(0, -BITS_PER_BUCKET), 2)
        : 0;
    const right = Number.parseInt(board.slice(-BITS_PER_BUCKET), 2);
    this.board = [left, right];
  }

  private initFromArray(board: number[]): void {
    if (
      board.length !== 2 ||
      board.some(
        (x) =>
          typeof x !== "number" ||
          !Number.isInteger(x) ||
          x < 0 ||
          x >= MAX_BITS,
      )
    ) {
      throw new RangeError(
        "array inputs to board must be two integers x where 0 <= x < 2 ^ 32",
      );
    }
    this.board = board;
  }

  private determineIfBitBoard(bb: BitBoard): boolean {
    return (
      bb instanceof BitBoard &&
      Array.isArray(bb.board) &&
      bb.board?.length === 2
    );
  }

  toString(): string {
    return this.board
      .map((b) => (b >>> 0).toString(2).padStart(BITS_PER_BUCKET, "0"))
      .join("");
  }

  getIndex(index: number): number {
    if (Math.floor(index) === index && index >= 0 && index < this.length) {
      const powOfTwo = 2 ** (index % BITS_PER_BUCKET);
      const bucketOffset = index >= BITS_PER_BUCKET ? 1 : 0;

      return (this.board[1 - bucketOffset] & powOfTwo) >>> 0 > 0 ? 1 : 0;
    }
    throw new RangeError(
      "index must be integer greater than or equal to 0 and less than 64",
    );
  }

  copy(): BitBoard {
    return new BitBoard(this.board.slice());
  }

  isEmpty(): boolean {
    return this.board[0] === 0 && this.board[1] === 0;
  }

  and(bb: BitBoard, modify = false): BitBoard {
    if (this.determineIfBitBoard(bb)) {
      const targetBoard = modify ? this : this.copy();

      for (let i = 0; i < this.board.length; i++) {
        targetBoard.board[i] = (targetBoard.board[i] & bb.board[i]) >>> 0;
      }
      return targetBoard;
    }
    throw new TypeError("Invalid input. Must be of type BitBoard");
  }

  or(bb: BitBoard, modify = false): BitBoard {
    if (this.determineIfBitBoard(bb)) {
      const targetBoard = modify ? this : this.copy();

      for (let i = 0; i < this.board.length; i++) {
        targetBoard.board[i] = (targetBoard.board[i] | bb.board[i]) >>> 0;
      }
      return targetBoard;
    }
    throw new TypeError(
      'Invalid input. Must be of type "BitBoard" or "number"',
    );
  }

  xOr(bb: BitBoard, modify = false): BitBoard {
    if (this.determineIfBitBoard(bb)) {
      const targetBoard = modify ? this : this.copy();

      for (let i = 0; i < this.board.length; i++) {
        targetBoard.board[i] = (targetBoard.board[i] ^ bb.board[i]) >>> 0;
      }
      return targetBoard;
    }
    throw new TypeError(
      'Invalid input. Must be of type "BitBoard" or "number"',
    );
  }

  private validateNumberArgs(shiftAmount: number, num: number): void {
    if (typeof shiftAmount !== "number" || typeof num !== "number") {
      throw new TypeError("Invalid input. Must be of type number");
    }
    if (
      shiftAmount < 0 ||
      shiftAmount >= this.length ||
      num < 0 ||
      num >= MAX_BITS
    ) {
      throw new RangeError("0 <= shiftAmount < 64 && 0 <= num <= 2 ^ 32 - 1");
    }
  }

  orNumber(shiftAmount = 0, num = 1, modify = false): BitBoard {
    this.validateNumberArgs(shiftAmount, num);
    const targetBoard = modify ? this : this.copy();
    const startDigits = (((num << shiftAmount) >>> 0) & UINT32_MASK) >>> 0;
    const startDigitMask = (startDigits & UINT32_MASK) >>> 0;
    const numCarryDigits = (num >>> (BITS_PER_BUCKET - shiftAmount)) >>> 0;

    if (shiftAmount === BITS_PER_BUCKET) {
      targetBoard.board[0] = (targetBoard.board[0] | num) >>> 0;
    } else if (shiftAmount === 0) {
      targetBoard.board[1] = (targetBoard.board[1] | startDigitMask) >>> 0;
    } else if (shiftAmount > BITS_PER_BUCKET && shiftAmount < BOARD_LENGTH) {
      targetBoard.board[0] = (targetBoard.board[0] | startDigitMask) >>> 0;
    } else {
      targetBoard.board[1] = (targetBoard.board[1] | startDigitMask) >>> 0;
      targetBoard.board[0] = (targetBoard.board[0] | numCarryDigits) >>> 0;
    }

    return targetBoard;
  }

  xOrNumber(shiftAmount = 0, num = 1, modify = false): BitBoard {
    this.validateNumberArgs(shiftAmount, num);
    const targetBoard = modify ? this : this.copy();
    const startDigits = (((num << shiftAmount) >>> 0) & UINT32_MASK) >>> 0;
    const startDigitMask = (startDigits & UINT32_MASK) >>> 0;
    const numCarryDigits = (num >>> (BITS_PER_BUCKET - shiftAmount)) >>> 0;

    if (shiftAmount === BITS_PER_BUCKET) {
      targetBoard.board[0] = (targetBoard.board[0] ^ num) >>> 0;
    } else if (shiftAmount === 0) {
      targetBoard.board[1] = (targetBoard.board[1] ^ startDigitMask) >>> 0;
    } else if (shiftAmount > BITS_PER_BUCKET) {
      targetBoard.board[0] = (targetBoard.board[0] ^ startDigitMask) >>> 0;
    } else {
      targetBoard.board[1] = (targetBoard.board[1] ^ startDigitMask) >>> 0;
      targetBoard.board[0] = (targetBoard.board[0] ^ numCarryDigits) >>> 0;
    }

    return targetBoard;
  }

  not(modify = false): BitBoard {
    const targetBoard = modify ? this : this.copy();

    for (let i = 0; i < targetBoard.board.length; i++) {
      targetBoard.board[i] = ~targetBoard.board[i] >>> 0;
    }
    return targetBoard;
  }

  shiftLeft(shiftAmount: number, modify = false): BitBoard {
    if (typeof shiftAmount !== "number") {
      throw new TypeError('Invalid input. Must be "number"');
    }
    if (shiftAmount < 0) {
      throw new RangeError("Invalid input. index must be >= 0");
    }

    const targetBoard = modify ? this : this.copy();
    const bitMask =
      ((2 ** shiftAmount - 1) << (BITS_PER_BUCKET - shiftAmount)) >>> 0;
    const carryDigits =
      ((targetBoard.board[1] & bitMask) >>> 0) >>>
      (BITS_PER_BUCKET - shiftAmount);

    if (shiftAmount === BITS_PER_BUCKET) {
      targetBoard.board[1] = 0;
      targetBoard.board[0] = carryDigits;
    } else if (shiftAmount > BITS_PER_BUCKET && shiftAmount < this.length) {
      targetBoard.board[0] =
        (targetBoard.board[1] << (shiftAmount - BITS_PER_BUCKET)) >>> 0;
      targetBoard.board[1] = 0;
    } else if (shiftAmount >= this.length) {
      targetBoard.board[0] = 0;
      targetBoard.board[1] = 0;
    } else {
      targetBoard.board[1] = (targetBoard.board[1] << shiftAmount) >>> 0;
      targetBoard.board[0] =
        (((targetBoard.board[0] << shiftAmount) >>> 0) | carryDigits) >>> 0;
    }

    return targetBoard;
  }

  shiftRight(shiftAmount: number, modify = false): BitBoard {
    if (typeof shiftAmount !== "number") {
      throw new TypeError('Invalid input. Must be "number"');
    }
    if (shiftAmount < 0) {
      throw new RangeError("Invalid input. index must be >= 0");
    }

    const targetBoard = modify ? this : this.copy();
    const bitMask =
      ((2 ** shiftAmount - 1) << (BITS_PER_BUCKET - shiftAmount)) >>> 0;
    const carryDigits =
      (((targetBoard.board[0] << (BITS_PER_BUCKET - shiftAmount)) >>> 0) &
        bitMask) >>>
      0;

    if (shiftAmount === BITS_PER_BUCKET) {
      targetBoard.board[0] = 0;
      targetBoard.board[1] = carryDigits;
    } else if (shiftAmount > BITS_PER_BUCKET && shiftAmount < this.length) {
      targetBoard.board[1] =
        (targetBoard.board[0] >>> (shiftAmount - BITS_PER_BUCKET)) >>> 0;
      targetBoard.board[0] = 0;
    } else if (shiftAmount >= this.length) {
      targetBoard.board[0] = 0;
      targetBoard.board[1] = 0;
    } else {
      targetBoard.board[0] = (targetBoard.board[0] >>> shiftAmount) >>> 0;
      targetBoard.board[1] =
        ((targetBoard.board[1] >>> shiftAmount) | carryDigits) >>> 0;
    }

    return targetBoard;
  }

  flipVertical(modify = false): BitBoard {
    const mask1 = new BitBoard(FLIP_V_MASK_1);
    const mask2 = new BitBoard(FLIP_V_MASK_2);

    let targetBoard: BitBoard = modify ? this : this.copy();
    targetBoard = targetBoard
      .shiftRight(8)
      .and(mask1)
      .or(targetBoard.and(mask1).shiftLeft(8));
    targetBoard = targetBoard
      .shiftRight(16)
      .and(mask2)
      .or(targetBoard.and(mask2).shiftLeft(16));
    targetBoard = targetBoard.shiftRight(32).or(targetBoard.shiftLeft(32));

    return targetBoard;
  }

  flipDiagonal(modify = false): BitBoard {
    const mask1 = new BitBoard(FLIP_D_MASK_1);
    const mask2 = new BitBoard(FLIP_D_MASK_2);
    const mask4 = new BitBoard(FLIP_D_MASK_4);

    const targetBoard: BitBoard = modify ? this : this.copy();

    let temp = targetBoard.xOr(targetBoard.shiftLeft(36));
    targetBoard.xOr(mask4.and(temp.xOr(targetBoard.shiftRight(36))), true);
    temp = mask2.and(targetBoard.xOr(targetBoard.shiftLeft(18)));
    targetBoard.xOr(temp.xOr(temp.shiftRight(18)), true);
    temp = mask1.and(targetBoard.xOr(targetBoard.shiftLeft(9)));

    return targetBoard.xOr(temp.xOr(temp.shiftRight(9)), true);
  }

  rotate180Degrees(modify = false): BitBoard {
    const maskh1 = new BitBoard(ROT_MASK_H1);
    const maskh2 = new BitBoard(ROT_MASK_H2);
    const maskh4 = new BitBoard(ROT_MASK_H4);
    const maskv1 = new BitBoard(ROT_MASK_V1);
    const maskv2 = new BitBoard(ROT_MASK_V2);

    let targetBoard = modify ? this : this.copy();
    targetBoard = targetBoard
      .shiftRight(1)
      .and(maskh1)
      .or(targetBoard.and(maskh1).shiftLeft(1));
    targetBoard = targetBoard
      .shiftRight(2)
      .and(maskh2)
      .or(targetBoard.and(maskh2).shiftLeft(2));
    targetBoard = targetBoard
      .shiftRight(4)
      .and(maskh4)
      .or(targetBoard.and(maskh4).shiftLeft(4));
    targetBoard = targetBoard
      .shiftRight(8)
      .and(maskv1)
      .or(targetBoard.and(maskv1).shiftLeft(8));
    targetBoard = targetBoard
      .shiftRight(16)
      .and(maskv2)
      .or(targetBoard.and(maskv2).shiftLeft(16));
    targetBoard = targetBoard.shiftRight(32).or(targetBoard.shiftLeft(32));

    return targetBoard;
  }

  rotate90DegreesClockwise(modify = false): BitBoard {
    const targetBoard = modify ? this : this.copy();
    return targetBoard.flipDiagonal().flipVertical();
  }
}

export default BitBoard;
