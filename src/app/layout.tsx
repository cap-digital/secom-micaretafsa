import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { FundoMicareta } from "@/components/FundoMicareta";
import "./globals.css";

const corpo = Inter({ variable: "--font-corpo", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: "Micareta de Feira 2026 · Dashboard",
  description: "Dashboard de veiculação — SECOM · Governo da Bahia",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#E0702A",
};

/**
 * ≥ 1024px: a página ocupa exatamente a tela (h-dvh, sem scroll vertical).
 * < 1024px: scroll vertical normal. O header fica em cada página (mostra o período).
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${display.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col text-[13px] lg:h-dvh lg:overflow-hidden">
        <FundoMicareta />
        {children}
      </body>
    </html>
  );
}
