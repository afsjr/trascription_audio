import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Transcrição de áudios do WhatsApp",
  description:
    "Transcreva, resuma e busque áudios de até 5 minutos recebidos no WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8">
          {children}
        </main>
      </body>
    </html>
  );
}
