"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GalleryImage = { src: string; alt: string };

export function ImageGallery({ images }: { images: GalleryImage[] }) {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);

    const prev = useCallback(
        () => setIndex((i) => (i - 1 + images.length) % images.length),
        [images.length]
    );
    const next = useCallback(
        () => setIndex((i) => (i + 1) % images.length),
        [images.length]
    );

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        globalThis.addEventListener("keydown", onKey);
        return () => globalThis.removeEventListener("keydown", onKey);
    }, [open, prev, next]);

    const colsMap: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2" };
    const cols = colsMap[images.length] ?? "grid-cols-2 sm:grid-cols-3";

    return (
        <>
            <div className={`mt-6 grid gap-3 ${cols}`}>
                {images.map((img, i) => (
                    <button
                        key={img.src}
                        onClick={() => { setIndex(i); setOpen(true); }}
                        className="group relative w-full h-48 overflow-hidden rounded-xl border border-border/60 bg-card/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 280px"
                            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        key="lightbox"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setOpen(false)}
                    >
                        {/* Close */}
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Prev */}
                        {images.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); prev(); }}
                                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}

                        {/* Image */}
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={images[index].src}
                                alt={images[index].alt}
                                width={0}
                                height={0}
                                sizes="90vw"
                                style={{ maxHeight: "90vh", width: "auto", height: "auto" }}
                                className="block rounded-xl"
                            />
                        </motion.div>

                        {/* Next */}
                        {images.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); next(); }}
                                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}

                        {/* Dots */}
                        {images.length > 1 && (
                            <div className="absolute bottom-4 flex gap-2">
                                {images.map((img, i) => (
                                    <button
                                        key={img.src}
                                        onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                                        className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
                                        aria-label={`Go to image ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
