import type { Metadata } from "next";
import { Schibsted_Grotesk, Inter } from "next/font/google";
import "./globals.css";
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
