import "./styles/globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "My Portfolio",
  description: "A modern portfolio with smooth animations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-white">{children}</body>
    </html>
  );
}
