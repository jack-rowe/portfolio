import { createContext } from "react";

/** Player slugs who won last week. Their icons wear a crown. */
export const ChampionsContext = createContext<ReadonlySet<string>>(new Set());
