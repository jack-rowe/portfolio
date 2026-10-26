// Optional artwork for games, keyed by the slug Firestore derives from the name
// ("Daily Holes" -> "daily-holes"). Anything without an entry shows its initial.

export const GAME_ICONS: Record<string, string> = {
  krillion: "/icons/krillion.png",
  "daily-holes": "/icons/dailyholes.png",
  plain: "/icons/plain.png",
};
