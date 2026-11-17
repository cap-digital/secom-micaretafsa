import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const corpo = Inter({ variable: "--font-corpo", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Micareta de Feira 2026 · SECOM Bahia",
  description: "Dashboard de veiculação — Governo da Bahia",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-[13px] lg:h-dvh lg:overflow-hidden">{children}</body>
    </html>
  );
}
