import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { Topbar } from "@/components/Topbar";
import "./globals.css";

const display = Anton({ variable: "--font-display", weight: "400", subsets: ["latin"] });
const corpo = Inter({ variable: "--font-corpo", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Micareta de Feira 2026 · SECOM Bahia",
  description: "Dashboard de veiculação — Governo da Bahia",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col lg:h-dvh lg:overflow-hidden">
        <Topbar />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
