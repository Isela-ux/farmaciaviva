import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Farmacia Viva",
    template: "%s | Farmacia Viva",
  },
  description:
    "Catálogo de plantas medicinales con fichas completas y consultas asistidas por inteligencia artificial.",
  keywords: ["plantas medicinales", "etnobotánica", "farmacia viva", "México"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Saltar al contenido principal
        </a>
        <Header />
        <main id="contenido-principal" className="flex min-h-0 flex-1 flex-col">
          {children}
        </main>
        <footer className="border-t border-forest/10 bg-botanical py-6 text-center text-xs text-earth">
          Farmacia Viva · VIC 2026 · Recurso educativo sobre plantas medicinales
        </footer>
      </body>
    </html>
  );
}
