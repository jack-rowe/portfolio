import "./styles/globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Jack Rowe",
  description: "Personal portfolio of Jack Rowe.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-white">{children}</body>
    </html>
  );
}
