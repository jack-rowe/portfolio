"use client";

import { useState } from "react";
import { ChevronUp, LandPlot, Menu, Printer } from "lucide-react";
import Link from "next/link";

export function NavMenu() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="fixed top-5 right-5 z-50">
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative w-6 h-6 text-muted-foreground hover:text-primary transition-colors duration-200"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
                <Menu
                    className={`w-6 h-6 absolute inset-0 transition-all duration-300 ${menuOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                        }`}
                />
                <ChevronUp
                    className={`w-6 h-6 absolute inset-0 transition-all duration-300 ${menuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                        }`}
                />
            </button>

            <div
                className={`absolute bg-background/20 backdrop-blur-md  pl-4 py-2 rounded-lg top-full mt-3 right-0 flex flex-col items-end gap-3 transition-all duration-300 ease-in-out ${menuOpen
                    ? "opacity-100 pointer-events-auto translate-y-0"
                    : "opacity-0 pointer-events-none -translate-y-2"
                    }`}
            >
                <Link
                    href="/golf"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                    <span className="text-sm font-medium whitespace-nowrap">Golf Scorecard</span>
                    <LandPlot className="w-6 h-6 flex-shrink-0" />
                </Link>

                <Link
                    href="/photo-print"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                    <span className="text-sm font-medium whitespace-nowrap">Photo Print Layout</span>
                    <Printer className="w-6 h-6 flex-shrink-0" />
                </Link>


            </div>
        </div>
    );
}
