"use client";

import { Button } from "@/components/ui/button";
import {
    ChessBoard,
    type BoardDragStart,
    type BoardMoveAttempt,
    type BoardOverlay,
} from "@/lib/chess/board-ui";
import { Game, type LayoutEntry } from "@/lib/chess/game";
import type { RenderState } from "@/lib/chess/types";
import { useCallback, useMemo, useRef, useState } from "react";
import { getBestMove } from "@/lib/chess/ai";

type Section = "home" | "about" | "projects" | "skills" | "contact";

// ── Square helpers ────────────────────────────────────────────────────

function sqRange(
    fileMin: number,
    fileMax: number,
    rankMin: number,
    rankMax: number,
): number[] {
    const out: number[] = [];
    for (let r = rankMin; r <= rankMax; r++)
        for (let f = fileMin; f <= fileMax; f++) out.push(r * 8 + f);
    return out;
}

// ── Overlay regions ───────────────────────────────────────────────────
// All indices 0-based: a=0 h=7, rank1=0 rank8=7.
// Each piece layout is verified not to land inside its own overlay region.

const F_A = 0, F_B = 1, F_C = 2, F_F = 5, F_G = 6, F_H = 7;
const R3 = 2, R4 = 3, R5 = 4, R6 = 5, R7 = 6;

// ABOUT — single 4×4 panel, c4-f7
const ABOUT_BOX = sqRange(F_C, F_F, R4, R7); // files 2-5, ranks 3-6

// PROJECTS — two 3×3 panels: a5-c7 (top-left) and f4-h6 (mid-right)
const PROJECTS_LEFT = sqRange(F_A, F_C, R5, R7); // files 0-2, ranks 4-6
const PROJECTS_RIGHT = sqRange(F_F, F_H, R4, R6); // files 5-7, ranks 3-5

// SKILLS — one wide 6×4 panel, b3-g6
const SKILLS_BOX = sqRange(F_B, F_G, R3, R6); // files 1-6, ranks 2-5

// CONTACT — single 4×4 panel, c3-f6
const CONTACT_BOX = sqRange(F_C, F_F, R3, R6); // files 2-5, ranks 2-5

// ── Piece layouts ─────────────────────────────────────────────────────
// Stable ids: p1-p8 = white pieces, p9-p12 = nav pawns, p13-p14 = black.
// All section layouts have nav on a1-e1; remaining 9 pieces are placed in
// realistic scattered positions that don't intersect their overlay region.

// HOME — Italian opening after 1.e4 e5 2.Nf3 Nc6 3.Bc4, white castled.
const HOME_LAYOUT: readonly LayoutEntry[] = [
    { id: "p1", piece: "K", square: "g1" },
    { id: "p2", piece: "Q", square: "d2" },
    { id: "p3", piece: "R", square: "a1" },
    { id: "p4", piece: "R", square: "f1" },
    { id: "p5", piece: "N", square: "c3" },
    { id: "p6", piece: "N", square: "f3" },
    { id: "p7", piece: "B", square: "b2" },
    { id: "p8", piece: "B", square: "e2" },
    { id: "p13", piece: "k", square: "f8" },
    { id: "p14", piece: "q", square: "e7" },
    { id: "p9", piece: "P", square: "d4" }, // About   ─ amber
    { id: "p10", piece: "P", square: "e4" }, // Projects─ green
    { id: "p11", piece: "p", square: "d5" }, // Skills  ─ cyan
    { id: "p12", piece: "p", square: "e5" }, // Contact ─ orange
];

// ABOUT — box c4-f7 (files 2-5, ranks 3-6).
// Pieces stay on the a/b and g/h wings + corners: no piece has (file 2-5 AND rank 3-6).
const ABOUT_LAYOUT: readonly LayoutEntry[] = [
    { id: "p1", piece: "K", square: "a1" }, // home
    { id: "p2", piece: "Q", square: "h6" }, // h file ✓
    { id: "p3", piece: "R", square: "a5" }, // a file ✓
    { id: "p4", piece: "R", square: "h4" }, // h file ✓
    { id: "p5", piece: "N", square: "b5" }, // b file ✓
    { id: "p6", piece: "N", square: "g5" }, // g file ✓
    { id: "p7", piece: "B", square: "b7" }, // b file ✓
    { id: "p8", piece: "B", square: "g3" }, // g file, rank 3 alg (idx 2) < 3 ✓
    { id: "p13", piece: "k", square: "a8" }, // a file ✓
    { id: "p14", piece: "q", square: "h8" }, // h file ✓
    { id: "p9", piece: "P", square: "b1" }, // About (active)
    { id: "p10", piece: "P", square: "c1" }, // Projects
    { id: "p11", piece: "p", square: "d1" }, // Skills
    { id: "p12", piece: "p", square: "e1" }, // Contact
];

// PROJECTS — box-left: files 0-2 ranks 4-6; box-right: files 5-7 ranks 3-5.
// Pieces on d/e files (safe from both boxes) + c/f outposts below box rank.
const PROJECTS_LAYOUT: readonly LayoutEntry[] = [
    { id: "p1", piece: "K", square: "a1" }, // home
    { id: "p2", piece: "Q", square: "d5" }, // d file ✓
    { id: "p3", piece: "R", square: "d3" }, // d file ✓
    { id: "p4", piece: "R", square: "e6" }, // e file ✓
    { id: "p5", piece: "N", square: "c3" }, // file 2 rank idx 2 < 4 → outside left ✓
    { id: "p6", piece: "N", square: "f3" }, // file 5 rank idx 2 < 3 → outside right ✓
    { id: "p7", piece: "B", square: "c4" }, // file 2 rank idx 3 < 4 → outside left ✓
    { id: "p8", piece: "B", square: "f7" }, // file 5 rank idx 6 > 5 → outside right ✓
    { id: "p13", piece: "k", square: "d8" }, // d file ✓
    { id: "p14", piece: "q", square: "e8" }, // e file ✓
    { id: "p9", piece: "P", square: "b1" }, // About
    { id: "p10", piece: "P", square: "c1" }, // Projects (active)
    { id: "p11", piece: "p", square: "d1" }, // Skills
    { id: "p12", piece: "p", square: "e1" }, // Contact
];

// SKILLS — box b3-g6 (files 1-6, ranks 2-5).
// Pieces ring the outside: a/h files, and b-g files on ranks 7-8 (above box).
const SKILLS_LAYOUT: readonly LayoutEntry[] = [
    { id: "p1", piece: "K", square: "a1" }, // home
    { id: "p2", piece: "Q", square: "h5" }, // h file ✓
    { id: "p3", piece: "R", square: "a4" }, // a file ✓
    { id: "p4", piece: "R", square: "h3" }, // h file ✓
    { id: "p5", piece: "N", square: "b7" }, // file 1 rank idx 6 > 5 → above box ✓
    { id: "p6", piece: "N", square: "g7" }, // file 6 rank idx 6 > 5 ✓
    { id: "p7", piece: "B", square: "c8" }, // file 2 rank idx 7 > 5 ✓
    { id: "p8", piece: "B", square: "f8" }, // file 5 rank idx 7 > 5 ✓
    { id: "p13", piece: "k", square: "d7" }, // file 3 rank idx 6 > 5 ✓
    { id: "p14", piece: "q", square: "e7" }, // file 4 rank idx 6 > 5 ✓
    { id: "p9", piece: "P", square: "b1" }, // About
    { id: "p10", piece: "P", square: "c1" }, // Projects
    { id: "p11", piece: "p", square: "d1" }, // Skills (active)
    { id: "p12", piece: "p", square: "e1" }, // Contact
];

// CONTACT — box c3-f6 (files 2-5, ranks 2-5).
// Pieces on a/b and g/h files across the board.
const CONTACT_LAYOUT: readonly LayoutEntry[] = [
    { id: "p1", piece: "K", square: "a1" }, // home
    { id: "p2", piece: "Q", square: "h5" }, // h file ✓
    { id: "p3", piece: "R", square: "a5" }, // a file ✓
    { id: "p4", piece: "R", square: "h4" }, // h file ✓
    { id: "p5", piece: "N", square: "b4" }, // b file ✓
    { id: "p6", piece: "N", square: "g4" }, // g file ✓
    { id: "p7", piece: "B", square: "b6" }, // b file ✓
    { id: "p8", piece: "B", square: "g6" }, // g file ✓
    { id: "p13", piece: "k", square: "a8" }, // a file ✓
    { id: "p14", piece: "q", square: "h8" }, // h file ✓
    { id: "p9", piece: "P", square: "b1" }, // About
    { id: "p10", piece: "P", square: "c1" }, // Projects
    { id: "p11", piece: "p", square: "d1" }, // Skills
    { id: "p12", piece: "p", square: "e1" }, // Contact (active)
];

const SECTION_LAYOUTS: Record<
    Exclude<Section, "home">,
    readonly LayoutEntry[]
> = {
    about: ABOUT_LAYOUT,
    projects: PROJECTS_LAYOUT,
    skills: SKILLS_LAYOUT,
    contact: CONTACT_LAYOUT,
};

// ── Button configs ────────────────────────────────────────────────────

const HOME_BUTTONS = {
    about: { sq: "d4", label: "About", glow: "#f59e0b" },
    projects: { sq: "e4", label: "Projects", glow: "#22c55e" },
    skills: { sq: "d5", label: "Skills", glow: "#06b6d4" },
    contact: { sq: "e5", label: "Contact", glow: "#f97316" },
} as const satisfies Record<
    Exclude<Section, "home">,
    { sq: string; label: string; glow: string }
>;

const NAV_BUTTONS = {
    about: { sq: "b1", label: "About" },
    projects: { sq: "c1", label: "Projects" },
    skills: { sq: "d1", label: "Skills" },
    contact: { sq: "e1", label: "Contact" },
} as const satisfies Record<
    Exclude<Section, "home">,
    { sq: string; label: string }
>;

const NAV_ACTIVE_GLOW = "#ef4444";
const NAV_INACTIVE_GLOW = "#64748b";
const HOME_GLOW = "#06b6d4";
const HOME_SQ = "a1";

// ── Section content ───────────────────────────────────────────────────

function Box({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`h-full w-full bg-background/95 backdrop-blur-sm border border-border rounded-md overflow-auto p-2 text-xs leading-relaxed pointer-events-auto ${className}`}
        >
            {children}
        </div>
    );
}

function Micro({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[clamp(0.45rem,1.1vw,0.7rem)] text-muted-foreground">
            {children}
        </span>
    );
}

function Cap({ children }: { children: React.ReactNode }) {
    return (
        <p className="font-clash text-[clamp(0.5rem,1.2vw,0.7rem)] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {children}
        </p>
    );
}

// ABOUT — 4×4 box, centred portrait panel
function AboutPanel() {
    return (
        <Box className="flex flex-col justify-center gap-2">
            <h2 className="font-clash text-[clamp(0.85rem,2.2vw,1.4rem)] font-black leading-tight">
                Hi — I build<br />things.
            </h2>
            <p className="text-[clamp(0.5rem,1.2vw,0.75rem)] text-muted-foreground">
                Software engineer focused on type-safe systems and interfaces that feel
                precise. This board <em>is</em> a chess engine — each piece has a stable
                identity and animates to its position.
            </p>
            <Micro>Click a glowing piece (rank 1) to navigate · king on a1 to return.</Micro>
        </Box>
    );
}

// PROJECTS — left 3×3 = list, right 3×3 = links
const PROJECTS = [
    { name: "Chess Engine", tech: "TypeScript", desc: "Bitboard engine, full legals, castling, en passant." },
    { name: "Portfolio", tech: "Next.js", desc: "This site — animated pieces via stable ids." },
    { name: "NHL Widgets", tech: "API Routes", desc: "Live standings + next-game data." },
];

function ProjectsListPanel() {
    return (
        <Box>
            <Cap>Projects</Cap>
            <ul className="space-y-2">
                {PROJECTS.map((p) => (
                    <li key={p.name} className="border-b border-border/30 pb-1.5 last:border-0">
                        <div className="font-semibold text-[clamp(0.5rem,1.2vw,0.72rem)]">{p.name}</div>
                        <div className="font-mono text-[clamp(0.44rem,1vw,0.62rem)] text-primary/60">{p.tech}</div>
                        <Micro>{p.desc}</Micro>
                    </li>
                ))}
            </ul>
        </Box>
    );
}

function ProjectsLinksPanel() {
    return (
        <Box className="flex flex-col justify-center gap-2">
            <Cap>Links</Cap>
            {(
                [
                    ["GitHub", "https://github.com"],
                    ["LinkedIn", "https://linkedin.com"],
                    ["Résumé", "/resume.pdf"],
                ] as [string, string][]
            ).map(([label, href]) => (
                <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[clamp(0.5rem,1.2vw,0.72rem)] text-primary hover:underline"
                >
                    {label} →
                </a>
            ))}
        </Box>
    );
}

// SKILLS — wide 6×4 box, tag cloud
const SKILLS = [
    "TypeScript", "React", "Next.js", "Tailwind",
    "Node.js", "Go", "Rust", "Python",
    "PostgreSQL", "Redis", "Docker", "Linux",
];

function SkillsPanel() {
    return (
        <Box className="flex flex-col gap-1.5">
            <Cap>Skills</Cap>
            <div className="flex flex-wrap gap-1">
                {SKILLS.map((s) => (
                    <span
                        key={s}
                        className="px-1.5 py-0.5 rounded border border-border bg-secondary/30 font-mono text-[clamp(0.44rem,1vw,0.65rem)]"
                    >
                        {s}
                    </span>
                ))}
            </div>
            <Micro>Full-stack · type-safe systems · clean interfaces</Micro>
        </Box>
    );
}

// CONTACT — single 4×4 box
function ContactPanel() {
    return (
        <Box className="flex flex-col gap-2 justify-center">
            <h2 className="font-clash text-[clamp(0.75rem,1.8vw,1.1rem)] font-black">
                Get in touch
            </h2>
            {(
                [
                    ["Email", "you@example.com", null],
                    ["GitHub", "github.com/you", "https://github.com"],
                    ["LinkedIn", "linkedin.com/in/you", "https://linkedin.com"],
                ] as [string, string, string | null][]
            ).map(([label, value, href]) => (
                <div key={label}>
                    <Cap>{label}</Cap>
                    {href ? (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[clamp(0.44rem,1.1vw,0.68rem)] text-primary hover:underline"
                        >
                            {value}
                        </a>
                    ) : (
                        <p className="font-mono text-[clamp(0.44rem,1.1vw,0.68rem)]">{value}</p>
                    )}
                </div>
            ))}
        </Box>
    );
}

// ── Overlay builders ──────────────────────────────────────────────────

function buildOverlays(section: Exclude<Section, "home">): BoardOverlay[] {
    switch (section) {
        case "about":
            return [{ id: "about", squares: ABOUT_BOX, content: <AboutPanel /> }];
        case "projects":
            return [
                { id: "proj-list", squares: PROJECTS_LEFT, content: <ProjectsListPanel /> },
                { id: "proj-links", squares: PROJECTS_RIGHT, content: <ProjectsLinksPanel /> },
            ];
        case "skills":
            return [{ id: "skills", squares: SKILLS_BOX, content: <SkillsPanel /> }];
        case "contact":
            return [{ id: "contact", squares: CONTACT_BOX, content: <ContactPanel /> }];
    }
}

// ── Chess game constants ─────────────────────────────────────────────

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AI_MOVE_DELAY = 50;

// ── Game state helpers ────────────────────────────────────────────────

const CHECK_GLOW = "#ef4444";

/** Pure helper — derives a status string from current game state. */
function computeGameStatus(game: Game): string {
    if (game.isCheckmate()) {
        const winner = game.getTurn() === "white" ? "Black" : "White";
        return `Checkmate \u2014 ${winner} wins!`;
    }
    if (game.isStalemate()) return "Stalemate \u2014 draw.";
    if (game.isInCheck()) return "Check!";
    return "";
}

/** Clears any prior check glow, then glows the king in check red if applicable. */
function applyCheckGlow(game: Game): void {
    game.clearAllGlows();
    if (!game.isInCheck()) return;
    const kingCode = game.getTurn() === "white" ? "K" : "k";
    for (let sq = 0; sq < 64; sq++) {
        if (game.getPieceAt(sq) === kingCode) { game.setGlow(sq, CHECK_GLOW); break; }
    }
}

function applyHome(game: Game): void {
    game.setLayout(HOME_LAYOUT);
    game.clearAllGlows();
    game.clearAllLabels();
    for (const key of Object.keys(HOME_BUTTONS) as Array<keyof typeof HOME_BUTTONS>) {
        game.setGlow(HOME_BUTTONS[key].sq, HOME_BUTTONS[key].glow);
        game.setLabel(HOME_BUTTONS[key].sq, HOME_BUTTONS[key].label);
    }
}

function applySection(game: Game, section: Exclude<Section, "home">): void {
    game.setLayout(SECTION_LAYOUTS[section]);
    game.clearAllGlows();
    game.clearAllLabels();
    game.setGlow(HOME_SQ, HOME_GLOW);
    game.setLabel(HOME_SQ, "Home");
    for (const key of Object.keys(NAV_BUTTONS) as Array<keyof typeof NAV_BUTTONS>) {
        game.setGlow(NAV_BUTTONS[key].sq, key === section ? NAV_ACTIVE_GLOW : NAV_INACTIVE_GLOW);
        game.setLabel(NAV_BUTTONS[key].sq, NAV_BUTTONS[key].label);
    }
}

// ── Page ──────────────────────────────────────────────────────────────

export default function ChessPage() {
    const gameRef = useRef<Game | null>(null);
    if (gameRef.current === null) {
        const g = new Game();
        applyHome(g);
        gameRef.current = g;
    }
    const game = gameRef.current;

    const [section, setSection] = useState<Section>("home");
    const [playing, setPlaying] = useState(false);
    const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
    const [aiThinking, setAiThinking] = useState(false);
    const [state, setState] = useState<RenderState>(() => game.getRenderState());
    const [gameStatus, setGameStatus] = useState("");

    const sync = useCallback(() => setState(game.getRenderState()), [game]);


    const aiColor = playerColor === "white" ? "black" : "white";

    const runAI = useCallback(
        (g: Game) => {
            setAiThinking(true);
            // Run on next tick so the human's move renders first
            setTimeout(() => {
                const mv = getBestMove(g, aiColor);
                if (mv) {
                    g.makeMove(mv.from, mv.to);
                    g.deselect();
                }
                applyCheckGlow(g);
                setAiThinking(false);
                setState(g.getRenderState());
                setGameStatus(computeGameStatus(g));
            }, AI_MOVE_DELAY);
        },
        [aiColor],
    );

    const startGame = useCallback(
        (color: "white" | "black" = playerColor) => {
            game.loadFEN(STARTING_FEN);
            game.clearAllGlows();
            game.clearAllLabels();
            setPlayerColor(color);
            setPlaying(true);
            setAiThinking(false);
            setGameStatus("");
            sync();
            // If player chose black, AI (white) moves immediately
            if (color === "black") {
                const mv = getBestMove(game, "white");
                if (mv) game.makeMove(mv.from, mv.to);
                sync();
            }
        },
        [game, sync, playerColor],
    );

    const quitGame = useCallback(() => {
        setPlaying(false);
        setAiThinking(false);
        applyHome(game);
        setSection("home");
        setGameStatus("");
        sync();
    }, [game, sync]);

    const goHome = useCallback(() => {
        applyHome(game);
        setSection("home");
        sync();
    }, [game, sync]);

    const goSection = useCallback(
        (next: Exclude<Section, "home">) => {
            applySection(game, next);
            setSection(next);
            sync();
        },
        [game, sync],
    );

    const handleNavClick = useCallback(
        (square: number) => {
            const alg = Game.toAlgebraic(square);
            if (section === "home") {
                for (const key of Object.keys(HOME_BUTTONS) as Array<keyof typeof HOME_BUTTONS>) {
                    if (HOME_BUTTONS[key].sq === alg) { goSection(key); return; }
                }
                return;
            }
            if (alg === HOME_SQ) { goHome(); return; }
            for (const key of Object.keys(NAV_BUTTONS) as Array<keyof typeof NAV_BUTTONS>) {
                if (NAV_BUTTONS[key].sq === alg && key !== section) { goSection(key); return; }
            }
        },
        [section, goHome, goSection],
    );

    const finalizeHumanTurn = useCallback(() => {
        applyCheckGlow(game);
        setGameStatus(computeGameStatus(game));
        sync();
        if (!game.isCheckmate() && !game.isStalemate()) runAI(game);
    }, [game, runAI, sync]);

    const canInteractWithBoard = useCallback(() => {
        const isOver = game.isCheckmate() || game.isStalemate();
        return !aiThinking && !isOver && game.getTurn() === playerColor;
    }, [aiThinking, game, playerColor]);

    const tryPlayerMove = useCallback(
        (from: number, to: number) => {
            if (!playing || !canInteractWithBoard()) return false;
            const result = game.makeMove(from, to);
            if (!result.ok) return false;
            finalizeHumanTurn();
            return true;
        },
        [playing, canInteractWithBoard, game, finalizeHumanTurn],
    );

    const handleSquareClick = useCallback(
        (square: number) => {
            if (!playing) {
                handleNavClick(square);
                return;
            }
            if (!canInteractWithBoard()) return;
            const moved = game.handleSquareClick(square);
            if (!moved) {
                sync();
                return;
            }
            finalizeHumanTurn();
        },
        [playing, handleNavClick, canInteractWithBoard, game, sync, finalizeHumanTurn],
    );

    const canDragPiece = useCallback(
        ({ piece }: BoardDragStart) =>
            playing &&
            canInteractWithBoard() &&
            ((playerColor === "white" && piece.piece === piece.piece.toUpperCase()) ||
                (playerColor === "black" && piece.piece === piece.piece.toLowerCase())),
        [playing, canInteractWithBoard, playerColor],
    );

    const handleDragStart = useCallback(
        ({ square }: BoardDragStart) => {
            if (!playing || !canInteractWithBoard()) return;
            game.select(square);
            sync();
        },
        [playing, canInteractWithBoard, game, sync],
    );

    const handleDragCancel = useCallback(() => {
        if (!playing) return;
        game.deselect();
        sync();
    }, [playing, game, sync]);

    const handleMoveAttempt = useCallback(
        ({ from, to }: BoardMoveAttempt) => tryPlayerMove(from, to),
        [tryPlayerMove],
    );

    const overlays = useMemo<BoardOverlay[]>(
        () => (playing || section === "home" ? [] : buildOverlays(section)),
        [playing, section],
    );

    let bottomBar: React.ReactNode;
    if (playing) {
        let turnLabel: string;
        if (aiThinking) {
            turnLabel = "AI thinking\u2026";
        } else if (game.getTurn() === playerColor) {
            turnLabel = `Your turn (${playerColor})`;
        } else {
            turnLabel = "";
        }
        bottomBar = (
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-4">
                    {gameStatus ? (
                        <span className="text-sm font-semibold text-primary">{gameStatus}</span>
                    ) : (
                        <span className="text-sm text-muted-foreground">{turnLabel}</span>
                    )}
                    <Button variant="outline" size="sm" onClick={() => startGame(playerColor)}>New Game</Button>
                    <Button variant="secondary" size="sm" onClick={quitGame}>Quit</Button>
                </div>
            </div>
        );
    } else if (section === "home") {
        bottomBar = (
            <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Click a glowing piece to explore.</p>
                <Button variant="outline" onClick={() => startGame("white")}>Play as White</Button>
                <Button variant="outline" onClick={() => startGame("black")}>Play as Black</Button>
            </div>
        );
    } else {
        bottomBar = (
            <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={goHome}>Back to Home</Button>
                <Button variant="outline" onClick={() => startGame("white")}>Play as White</Button>
                <Button variant="outline" onClick={() => startGame("black")}>Play as Black</Button>
            </div>
        );
    }

    return (
        <div className="font-clash relative min-h-screen flex items-center justify-center px-4 py-8">
            <div className="flex flex-col items-center w-full gap-4">
                <ChessBoard
                    state={state}
                    onSquareClick={handleSquareClick}
                    overlays={overlays}
                    dragHandlers={{
                        canStart: canDragPiece,
                        onDragStart: handleDragStart,
                        onDragCancel: handleDragCancel,
                        onMoveAttempt: handleMoveAttempt,
                    }}
                />
                {bottomBar}
            </div>
        </div>
    );
}

