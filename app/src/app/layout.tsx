import type { Metadata } from "next";
import { Schibsted_Grotesk, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SeedProvider } from "@/components/providers/SeedProvider";
import { DensityProvider } from "@/components/providers/DensityProvider";

const display = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sans = Hanken_Grotesk({
  variable: "--font-sans-base",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-base",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body>
        <DensityProvider>
          <SeedProvider>{children}</SeedProvider>
        </DensityProvider>
      </body>
    </html>
  );
}
