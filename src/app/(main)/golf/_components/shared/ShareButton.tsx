"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ShareableState } from "../../_lib/share";
import { buildShareUrl } from "../../_lib/share";

type Props = { state: ShareableState };

export function ShareButton({ state }: Props) {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => {
                let url: string;
                try {
                    url = buildShareUrl(window.location.origin, state);
                } catch {
                    toast.error("Could not build share link");
                    return;
                }
                if (!navigator.clipboard) {
                    toast.error("Clipboard unavailable");
                    return;
                }
                navigator.clipboard.writeText(url).then(
                    () => {
                        toast.success("Share link copied");
                    },
                    () => {
                        toast.error("Could not copy link");
                    },
                );
            }}
            className="text-muted-foreground hover:text-foreground gap-1.5"
        >
            <Share2 aria-hidden="true" className="w-3.5 h-3.5" /> Share
        </Button>
    );
}
