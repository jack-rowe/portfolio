import type { Metadata } from "next";
import { DailyBoard } from "../_components/DailyBoard";

// Not linked from the nav. Writes are locked down by firebase/firestore.rules either way.
export const metadata: Metadata = {
  title: "Scorekeeper · Daily Games League",
  robots: { index: false, follow: false },
};

export default function DailyAdminPage() {
  return <DailyBoard admin />;
}
