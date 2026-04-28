"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LegacyRedirect() {
    const params = useSearchParams();
    const router = useRouter();
    const blob = params.get("d");

    useEffect(() => {
        if (blob) {
            router.replace(`/golf/share/${blob}`);
        } else {
            router.replace("/golf");
        }
    }, [blob, router]);

    return <div className="min-h-screen" />;
}

export default function GolfSharePage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <LegacyRedirect />
        </Suspense>
    );
}
