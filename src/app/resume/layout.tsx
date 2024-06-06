import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jack Rowe - Resume",
  description: "Jack Rowe's personal website.",
};

export default function ResumeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
