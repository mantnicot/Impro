import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { TavaWatermark } from "@/components/TavaWatermark";

export const metadata: Metadata = {
  title: "TAVA Object Roulette",
  description: "Ruleta de objetos teatrales para improvisación — Grupo TAVA",
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
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-body antialiased">
        <TavaWatermark />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
