import "./styles/globals.css";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: "Jack Rowe",
  description: "Personal portfolio of Jack Rowe.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
