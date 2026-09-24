import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Caveat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { TavaWatermark } from "@/components/TavaWatermark";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-show",
  display: "swap",
});

export const metadata: Metadata = {
  title: "#TAVA en el acto",
  description: "Improvisación teatral — TAVA EN EL ACTO",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/tava-logo.png", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/tava-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A3A82",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bebas.variable} ${caveat.variable}`}>
      <body className="font-body antialiased">
        <TavaWatermark />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
