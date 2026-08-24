import type { Metadata } from "next";
import { Schibsted_Grotesk, Inter } from "next/font/google";
import "./globals.css";
// The design system, consumed as a package rather than copied in.
// Order matters: the library lands after globals.css so its components resolve
// to library values, and the brand theme lands after the library so a brand can
// override the contract. The bridge points the library's font tokens at the
// faces next/font actually loaded.
import "@realwired/ui/styles.css";
import "@realwired/ui/themes/parachute.css";
import "./realwired-bridge.css";
import { SeedProvider } from "@/components/providers/SeedProvider";
import { DensityProvider } from "@/components/providers/DensityProvider";

const display = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Body / UI / numbers — Inter (variable). Tabular figures are enabled in
// globals.css for aligned columns. No monospace anywhere in the app.
const sans = Inter({
  variable: "--font-sans-base",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parachute — Appraisal Intelligence",
  description:
    "AI appraisal review for banks. Review findings, control the output, compile the workbook.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // The brand theme keys off this. One attribute is the entire difference
      // between Parachute and any other product in the suite.
      data-brand="parachute"
      className={`${display.variable} ${sans.variable}`}
    >
      <body>
        <DensityProvider>
          <SeedProvider>{children}</SeedProvider>
        </DensityProvider>
      </body>
    </html>
  );
}
