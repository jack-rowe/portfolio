"use client";

import { useRef, useState, useCallback } from "react";
import { Printer, FolderOpen } from "lucide-react";
import Link from "next/link";

const IMAGE_EXTS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "bmp",
  "tiff", "tif", "avif", "heic", "svg",
]);

const COL_MAP: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 2, 6: 3 };

const PER_PAGE_OPTIONS: number[] = [1, 2, 3, 4, 6];

export default function PhotoPrintPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [perPage, setPerPage] = useState(2);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((raw: FileList | null) => {
    if (!raw) return;
    const filtered = Array.from(raw).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      return IMAGE_EXTS.has(ext);
    });
    filtered.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    );
    setFiles(filtered);
  }, []);

  const cols = COL_MAP[perPage] ?? Math.ceil(Math.sqrt(perPage));
  const rows = Math.ceil(perPage / cols);
  const totalPages = files.length === 0 ? 0 : Math.ceil(files.length / perPage);

  return (
    <div className="font-clash min-h-screen bg-background text-foreground">
      {/* Controls bar */}
      <header className="bg-card border-b border-border px-8 py-5 flex items-center gap-6 flex-wrap print:hidden">
        <div className="mr-auto flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
            <Printer className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-semibold uppercase tracking-widest text-primary">
            Photo Print Layout
          </h1>
        </div>

        <input
          ref={inputRef}
          type="file"
          // @ts-expect-error webkitdirectory is non-standard
          webkitdirectory=""
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium uppercase tracking-wider hover:opacity-85 transition-opacity"
        >
          <FolderOpen className="w-4 h-4" />
          Choose Folder
        </button>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Photos per page</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="bg-background border border-border text-foreground px-3 py-1.5 rounded text-sm font-mono"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <button
          onClick={() => globalThis.print()}
          disabled={files.length === 0}
          className="px-4 py-2 rounded bg-card border border-border text-foreground text-sm font-medium uppercase tracking-wider hover:border-primary/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Print
        </button>
      </header>

      {/* Preview area */}
      <div className="print:p-0 px-8 py-10">
        {files.length === 0 ? (
          <div className="print:hidden flex flex-col items-center justify-center min-h-[50vh] gap-4 text-muted-foreground">
            <FolderOpen className="w-12 h-12 opacity-30" />
            <p className="text-sm uppercase tracking-widest">Click &ldquo;Choose Folder&rdquo; to select images</p>
          </div>
        ) : (
          <>
            <p className="print:hidden text-xs uppercase tracking-widest text-muted-foreground mb-6">
              Print Preview &mdash; {perPage} photo{perPage === 1 ? "" : "s"} per page &bull; {files.length} image{files.length === 1 ? "" : "s"} across {totalPages} page{totalPages === 1 ? "" : "s"}
            </p>

            <div className="flex flex-col gap-8 items-center">
              {Array.from({ length: totalPages }, (_, p) => (
                <div
                  key={p}
                  className="bg-white print:shadow-none shadow-xl"
                  style={{
                    // Screen: scale 8.5in page to ~680px wide for preview
                    width: "680px",
                    aspectRatio: "8.5 / 11",
                    padding: "calc(680px * 0.75 / 8.5) calc(680px * 0.625 / 8.5)",
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gap: "12px",
                    position: "relative",
                  }}
                >
                  {Array.from({ length: perPage }, (_, s) => {
                    const idx = p * perPage + s;
                    const file = files[idx];
                    return (
                      <div
                        key={s}
                        className="overflow-hidden flex items-center justify-center"
                      >
                        {file ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-contain block"
                          />
                        ) : (
                          <span className="text-xs text-gray-300 font-sans">Empty slot</span>
                        )}
                      </div>
                    );
                  })}
                  <div className="print:hidden absolute bottom-3 right-4 text-[10px] text-gray-400 font-sans">
                    Page {p + 1} of {totalPages}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          .bg-white {
            width: 8.5in !important;
            height: 11in !important;
            aspect-ratio: unset !important;
            margin: 0 !important;
            padding: 0.75in 0.625in !important;
            gap: 0.2in !important;
            page-break-after: always;
            break-after: page;
            box-shadow: none !important;
          }
          .bg-white:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          @page { size: letter portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
}
