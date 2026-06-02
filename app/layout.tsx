import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const feather = Fredoka({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-feather",
  display: "swap"
});

const dinRound = Nunito_Sans({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-din-round",
  display: "swap",
  adjustFontFallback: false
});

export const metadata: Metadata = {
  title: "Flick",
  description: "Creator tips in one tactile flick.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_FLICK_BASE_URL || "http://localhost:3000"),
  icons: {
    icon: [{ url: "/ico.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/ico.svg", type: "image/svg+xml" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${feather.variable} ${dinRound.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
