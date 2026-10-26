"use client";

import dynamic from "next/dynamic";
import { useDailyData, useToday } from "../_hooks/use-daily-data";
import { parseDateKey } from "../_lib/dates";
import { Board } from "./Board";
import { DailyHeader } from "./DailyHeader";

// Keeps Firebase Auth and the entry UI out of the public page's bundle.
const AdminPanel = dynamic(() => import("./AdminPanel").then((m) => m.AdminPanel), { ssr: false });

/** The whole page: header, the entry panel on the admin route, then the board. */
export function DailyBoard({ admin = false }: { admin?: boolean }) {
    const data = useDailyData();
    const today = useToday();

    return (
        <div className="relative min-h-screen flex flex-col px-4 sm:px-8 max-w-screen-lg mx-auto py-4">
            <DailyHeader date={today ? parseDateKey(today) : null} />
            <div className="flex flex-col gap-6 py-4">
                {admin && <AdminPanel {...data} today={today} />}
                <Board {...data} today={today} />
            </div>
        </div>
    );
}
