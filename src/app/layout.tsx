import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastHost } from "@/components/ToastHost";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LASG PTS Portal",
  description: "Reporting and review portal for LASG PTS 2.0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${manrope.variable} ${plusJakartaSans.variable}`}>
      <head>
        {/* Adds the dark class before first paint so a saved dark-mode
            preference doesn't flash light on reload. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastHost />
        {children}
      </body>
    </html>
  );
}
