"use client";

import { useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { addPlayer, deleteResult, describeError, removeGame, renamePlayer, saveResult } from "~firebase/scores";
import type { Game, Player, Result } from "~firebase/types";
import { addDays, formatDay, isDateKey } from "../_lib/dates";
import { blankEntry, checkEntry, describeGame, entryFromResult, type Entry } from "../_lib/scoring";
import { Container } from "./Container";
import { GameIconButton } from "./GameIconButton";
import { IconButton } from "./IconButton";
import { NewGameForm } from "./NewGameForm";
import { PlayerIconButton } from "./PlayerIconButton";
import { ScoreInput } from "./ScoreInput";

const LAST_PLAYER_KEY = "daily:last-player";
const CONFIRM_MS = 4000;

type Props = {
    players: Player[];
    games: Game[];
    results: Result[];
    today: string;
};

type Status = { tone: "ok" | "error"; text: string };

function readLastPlayer(): string | null {
    try {
        return localStorage.getItem(LAST_PLAYER_KEY);
    } catch {
        return null;
    }
}

function writeLastPlayer(slug: string) {
    try {
        localStorage.setItem(LAST_PLAYER_KEY, slug);
    } catch {
        // Private mode or blocked storage: just don't remember.
    }
}

function SectionHeading({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <h2 className="font-clash text-base font-bold tracking-wide uppercase text-muted-foreground">{children}</h2>
            {action}
        </div>
    );
}

/** Tap once to arm, tap again within a few seconds to confirm. */
function useConfirm() {
    const [armed, setArmed] = useState<string | null>(null);
    useEffect(() => {
        if (!armed) return;
        const timer = setTimeout(() => {
            setArmed(null);
        }, CONFIRM_MS);
        return () => {
            clearTimeout(timer);
        };
    }, [armed]);
    return [armed, setArmed] as const;
}

export function EntryPanel({ players, games, results, today }: Props) {
    const id = useId();
    const [playerSlug, setPlayerSlug] = useState<string | null>(null);
    const [date, setDate] = useState(today);
    const [openSlug, setOpenSlug] = useState<string | null>(null);
    const [entry, setEntry] = useState<Entry | null>(null);
    const [status, setStatus] = useState<Status | null>(null);
    const [entryError, setEntryError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState(false);
    const [armedRemove, setArmedRemove] = useConfirm();
    const [armedDelete, setArmedDelete] = useConfirm();
    const [addingPlayer, setAddingPlayer] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState("");
    const [editingPlayers, setEditingPlayers] = useState(false);
    const [renameSlug, setRenameSlug] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [addingGame, setAddingGame] = useState(false);

    // Restore the last-picked player once players have loaded.
    useEffect(() => {
        if (playerSlug && players.some((p) => p.slug === playerSlug)) return;
        const last = readLastPlayer();
        setPlayerSlug(last && players.some((p) => p.slug === last) ? last : null);
    }, [players, playerSlug]);

    const player = players.find((p) => p.slug === playerSlug) ?? null;
    const openGame = games.find((g) => g.slug === openSlug) ?? null;

    /** The picked player's results on one day, by game. */
    const loggedOn = (day: string) => {
        const map = new Map<string, Result>();
        if (!player) return map;
        for (const r of results) {
            if (r.player === player.slug && r.date === day) map.set(r.game, r);
        }
        return map;
    };
    const logged = loggedOn(date);
    const existing = openGame ? logged.get(openGame.slug) : undefined;

    const dateError = !isDateKey(date) ? "Pick a date." : date > today ? "Pick today or an earlier day." : null;
    const check = openGame ? checkEntry(openGame, entry) : null;
    const canSave = Boolean(player && openGame && check?.ok && !dateError && !busy);

    const pickDate = (day: string) => {
        setDate(day);
        setStatus(null);
        setArmedDelete(null);
        // Show that day's score in an open panel, or a blank one if there isn't one.
        if (openGame) {
            const prior = isDateKey(day) ? loggedOn(day).get(openGame.slug) : undefined;
            setEntry(prior ? entryFromResult(openGame, prior) : blankEntry(openGame));
        }
    };

    const pickPlayer = (slug: string) => {
        setPlayerSlug(slug);
        writeLastPlayer(slug);
        setStatus(null);
        // A different player's old score would be misleading in an open panel.
        if (openGame) setEntry(blankEntry(openGame));
    };

    const openEntry = (game: Game) => {
        setStatus(null);
        setEntryError(null);
        setArmedDelete(null);
        if (openSlug === game.slug) {
            setOpenSlug(null);
            return;
        }
        const prior = logged.get(game.slug);
        setOpenSlug(game.slug);
        setEntry(prior ? entryFromResult(game, prior) : blankEntry(game));
    };

    const closeEntry = () => {
        setOpenSlug(null);
        setEntryError(null);
    };

    const onGameTap = async (game: Game) => {
        if (!editing) {
            openEntry(game);
            return;
        }
        if (armedRemove !== game.slug) {
            setArmedRemove(game.slug);
            return;
        }
        setArmedRemove(null);
        try {
            await removeGame(game.slug);
            if (openSlug === game.slug) closeEntry();
            setStatus({ tone: "ok", text: `Removed ${game.name}. Its scores are kept.` });
        } catch (err) {
            setStatus({ tone: "error", text: describeError(err, "remove the game") });
        }
    };

    const save = async () => {
        if (!player || !openGame || !check?.ok || dateError) return;
        setBusy(true);
        setEntryError(null);
        try {
            await saveResult({
                game: openGame.slug,
                gameName: openGame.name,
                player: player.slug,
                date,
                ...check.value,
            });
            const when = date === today ? "" : ` on ${formatDay(date)}`;
            setStatus({ tone: "ok", text: `Saved ${openGame.name} ${check.value.shown} for ${player.name}${when}.` });
            closeEntry();
        } catch (err) {
            setEntryError(describeError(err, "save"));
        } finally {
            setBusy(false);
        }
    };

    const removeExisting = async () => {
        if (!existing || !player || !openGame) return;
        if (armedDelete !== existing.id) {
            setArmedDelete(existing.id);
            return;
        }
        setArmedDelete(null);
        setBusy(true);
        try {
            await deleteResult(existing.id);
            setStatus({ tone: "ok", text: `Deleted ${player.name}'s ${openGame.name} score.` });
            closeEntry();
        } catch (err) {
            setEntryError(describeError(err, "delete the score"));
        } finally {
            setBusy(false);
        }
    };

    const submitPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlayerName.trim()) return;
        setBusy(true);
        try {
            const slug = await addPlayer(newPlayerName);
            pickPlayer(slug);
            setStatus({ tone: "ok", text: `Added ${newPlayerName.trim()}.` });
            setNewPlayerName("");
            setAddingPlayer(false);
        } catch (err) {
            setStatus({ tone: "error", text: describeError(err, "add the player") });
        } finally {
            setBusy(false);
        }
    };

    const startRename = (p: Player) => {
        setStatus(null);
        setRenameSlug(p.slug);
        setRenameValue(p.name);
    };

    const submitRename = async (e: React.FormEvent) => {
        e.preventDefault();
        const target = players.find((p) => p.slug === renameSlug);
        const name = renameValue.trim();
        if (!target || !name) return;
        if (name === target.name) {
            setRenameSlug(null);
            return;
        }
        const taken = players.find((p) => p.slug !== target.slug && p.name.toLowerCase() === name.toLowerCase());
        if (taken) {
            setStatus({ tone: "error", text: `There's already a player called ${taken.name}.` });
            return;
        }
        setBusy(true);
        try {
            await renamePlayer(target.slug, name);
            setStatus({ tone: "ok", text: `Renamed ${target.name} to ${name}.` });
            setRenameSlug(null);
        } catch (err) {
            setStatus({ tone: "error", text: describeError(err, "rename the player") });
        } finally {
            setBusy(false);
        }
    };

    const onEntryKeyDown =(e: React.KeyboardEvent) => {
        if (e.key !== "Enter" || e.defaultPrevented) return;
        // Let Cancel and Delete keep their own Enter behavior.
        if ((e.target as HTMLElement).closest("[data-no-enter-save]")) return;
        e.preventDefault();
        if (canSave) void save();
    };

    return (
        <Container className="flex flex-col gap-5">
            <p
                role="status"
                className={cn(
                    "text-sm empty:hidden",
                    status?.tone === "error" ? "text-destructive" : "text-primary font-medium",
                )}
            >
                {status?.text}
            </p>

            <section className="flex flex-col gap-3">
                <SectionHeading
                    action={
                        date !== today && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    pickDate(today);
                                }}
                            >
                                Back to today
                            </Button>
                        )
                    }
                >
                    Day
                </SectionHeading>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Previous day"
                        disabled={!isDateKey(date)}
                        onClick={() => {
                            pickDate(addDays(date, -1));
                        }}
                    >
                        <ChevronLeft aria-hidden />
                    </Button>
                    <Input
                        id={`${id}-date`}
                        type="date"
                        aria-label="Day"
                        max={today}
                        className="w-44"
                        value={date}
                        onChange={(e) => {
                            pickDate(e.target.value);
                        }}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Next day"
                        disabled={!isDateKey(date) || date >= today}
                        onClick={() => {
                            pickDate(addDays(date, 1));
                        }}
                    >
                        <ChevronRight aria-hidden />
                    </Button>
                    <span
                        className={cn(
                            "text-sm",
                            date === today ? "text-muted-foreground" : "font-medium text-primary",
                        )}
                    >
                        {dateError ?? (date === today ? "Today" : formatDay(date))}
                    </span>
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <SectionHeading
                    action={
                        players.length > 0 && (
                            <Button
                                type="button"
                                variant={editingPlayers ? "secondary" : "ghost"}
                                size="sm"
                                aria-pressed={editingPlayers}
                                onClick={() => {
                                    setEditingPlayers((v) => !v);
                                    setRenameSlug(null);
                                    setAddingPlayer(false);
                                }}
                            >
                                {editingPlayers ? "Done" : "Edit players"}
                            </Button>
                        )
                    }
                >
                    Player
                </SectionHeading>
                {editingPlayers && <p className="-mt-1 text-sm text-muted-foreground">Tap a player to rename them.</p>}
                <div className="flex flex-wrap gap-2">
                    {players.map((p) => (
                        <PlayerIconButton
                            key={p.slug}
                            player={p}
                            size="md"
                            selected={editingPlayers ? p.slug === renameSlug : p.slug === playerSlug}
                            sublabel={editingPlayers ? "Rename" : undefined}
                            ariaLabel={editingPlayers ? `Rename ${p.name}` : undefined}
                            onClick={() => {
                                if (editingPlayers) startRename(p);
                                else pickPlayer(p.slug);
                            }}
                        />
                    ))}
                    {!editingPlayers && (
                        <IconButton
                            label="Add player"
                            showLabel
                            size="md"
                            className="rounded-full border-dashed"
                            icon={<Plus aria-hidden className="h-5 w-5 text-primary" />}
                            selected={addingPlayer}
                            onClick={() => {
                                setAddingPlayer((v) => !v);
                            }}
                        />
                    )}
                </div>
                {editingPlayers && renameSlug && (
                    <form onSubmit={submitRename} className="flex items-end gap-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${id}-rename`}>New name</Label>
                            <Input
                                id={`${id}-rename`}
                                autoFocus
                                autoComplete="off"
                                maxLength={40}
                                value={renameValue}
                                onChange={(e) => {
                                    setRenameValue(e.target.value);
                                }}
                                onFocus={(e) => {
                                    e.target.select();
                                }}
                            />
                        </div>
                        <Button type="submit" disabled={busy || !renameValue.trim()}>
                            Save
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setRenameSlug(null);
                            }}
                        >
                            Cancel
                        </Button>
                    </form>
                )}
                {addingPlayer && (
                    <form onSubmit={submitPlayer} className="flex items-end gap-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${id}-player`}>Name</Label>
                            <Input
                                id={`${id}-player`}
                                autoFocus
                                autoComplete="off"
                                maxLength={40}
                                value={newPlayerName}
                                onChange={(e) => {
                                    setNewPlayerName(e.target.value);
                                }}
                            />
                        </div>
                        <Button type="submit" disabled={busy || !newPlayerName.trim()}>
                            Add
                        </Button>
                    </form>
                )}
            </section>

            <section className="flex flex-col gap-3">
                <SectionHeading
                    action={
                        games.length > 0 && (
                            <Button
                                type="button"
                                variant={editing ? "secondary" : "ghost"}
                                size="sm"
                                aria-pressed={editing}
                                onClick={() => {
                                    setEditing((v) => !v);
                                    setArmedRemove(null);
                                    closeEntry();
                                }}
                            >
                                {editing ? "Done" : "Edit games"}
                            </Button>
                        )
                    }
                >
                    Game
                </SectionHeading>
                {editing && <p className="-mt-1 text-sm text-muted-foreground">Tap a game twice to remove it.</p>}
                {!editing && !player && players.length > 0 && (
                    <p className="-mt-1 text-sm text-muted-foreground">Pick a player first.</p>
                )}
                <div className="flex flex-wrap gap-2">
                    {games.map((g) => {
                        const done = logged.get(g.slug);
                        const armed = armedRemove === g.slug;
                        return (
                            <GameIconButton
                                key={g.slug}
                                game={g}
                                size="md"
                                disabled={!editing && !player}
                                selected={!editing && openSlug === g.slug}
                                danger={editing && armed}
                                sublabel={
                                    editing
                                        ? armed
                                            ? "Tap again"
                                            : "Remove"
                                        : done
                                          ? `✓ ${done.shown}`
                                          : describeGame(g)
                                }
                                ariaLabel={
                                    editing
                                        ? armed
                                            ? `Tap again to remove ${g.name}`
                                            : `Remove ${g.name}`
                                        : `${g.name}${done ? `, logged ${done.shown}` : ""}`
                                }
                                onClick={() => {
                                    void onGameTap(g);
                                }}
                            />
                        );
                    })}
                    {!editing && (
                        <IconButton
                            label="New game"
                            showLabel
                            size="md"
                            className="border-dashed"
                            icon={<Plus aria-hidden className="h-5 w-5 text-primary" />}
                            selected={addingGame}
                            onClick={() => {
                                setAddingGame((v) => !v);
                            }}
                        />
                    )}
                </div>
                {addingGame && (
                    <NewGameForm
                        onCancel={() => {
                            setAddingGame(false);
                        }}
                        onDone={(text) => {
                            setStatus({ tone: "ok", text });
                            setAddingGame(false);
                        }}
                    />
                )}
            </section>

            {openGame && player && (
                <section
                    aria-label={`${openGame.name} score for ${player.name}`}
                    onKeyDown={onEntryKeyDown}
                    className="flex flex-col gap-4 rounded-lg border border-primary/40 p-3"
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-clash text-xl font-bold leading-tight truncate">
                                {openGame.name} · {player.name}
                            </h3>
                            {date !== today && isDateKey(date) && (
                                <p className="text-sm font-medium text-primary">For {formatDay(date)}</p>
                            )}
                            {existing && (
                                <p className="text-sm text-muted-foreground">
                                    Already logged {existing.shown}. Saving replaces it.
                                </p>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Close"
                            data-no-enter-save
                            onClick={closeEntry}
                        >
                            <X aria-hidden />
                        </Button>
                    </div>

                    <ScoreInput game={openGame} entry={entry} onChange={setEntry} />

                    {(entryError ?? dateError ?? (check && !check.ok && check.error)) && (
                        <p role="alert" className="text-sm text-destructive">
                            {entryError ?? dateError ?? (check && !check.ok ? check.error : null)}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" disabled={!canSave} onClick={() => void save()}>
                            {busy ? "Saving…" : "Save"}
                        </Button>
                        <Button type="button" variant="ghost" data-no-enter-save onClick={closeEntry}>
                            Cancel
                        </Button>
                        {existing && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="ml-auto text-destructive hover:text-destructive"
                                data-no-enter-save
                                disabled={busy}
                                onClick={() => void removeExisting()}
                            >
                                <Trash2 aria-hidden />
                                {armedDelete === existing.id ? "Tap again to delete" : "Delete score"}
                            </Button>
                        )}
                    </div>
                </section>
            )}
        </Container>
    );
}
