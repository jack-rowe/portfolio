import Navbar from "@/components/Navbar";
import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const font = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Jack Rowe",
  description: "Jack Rowe's personal website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(font.className, "bg-background text-text mt-14")}>
        <Navbar />
        <div className="absolute h-full w-full -z-10">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#7077A12e_1px,transparent_1px),linear-gradient(to_bottom,#7077A12e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        </div>
        <div>{children}</div>
      </body>
    </html>
  );
}
