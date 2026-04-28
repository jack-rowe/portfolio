"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ShareableState } from "../../_lib/share";
import { buildShareUrl } from "../../_lib/share";

type Props = { state: ShareableState };

async function handleShare(state: ShareableState) {
    let url: string;
    try {
        url = buildShareUrl(globalThis.location.origin, state);
    } catch {
        toast.error("Could not build share link");
        return;
    }

    if (navigator.share) {
        try {
            await navigator.share({ url });
        } catch (err) {
            // AbortError means the user dismissed the sheet — not an error
            if (err instanceof Error && err.name !== "AbortError") {
                toast.error("Could not share link");
            }
        }
        return;
    }

    if (!navigator.clipboard) {
        toast.error("Clipboard unavailable");
        return;
    }
    navigator.clipboard.writeText(url).then(
        () => toast.success("Share link copied"),
        () => toast.error("Could not copy link"),
    );
}

export function ShareButton({ state }: Props) {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShare(state)}
            className="text-muted-foreground hover:text-foreground gap-1.5"
        >
            <Share2 aria-hidden="true" className="w-3.5 h-3.5" /> Share
        </Button>
    );
}
