import type { Metadata } from "next";
import { DailyBoard } from "./_components/DailyBoard";

export const metadata: Metadata = {
  title: "Daily Games League",
  description: "Who's winning Wordle, Connections and the rest this week.",
};

export default function DailyPage() {
  return <DailyBoard />;
}
