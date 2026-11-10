"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") {
    return null;
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Transcrição WhatsApp
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-slate-600 hover:text-brand">
            Início
          </Link>
          <Link href="/historico" className="text-slate-600 hover:text-brand">
            Histórico
          </Link>
          <button type="button" onClick={logout} className="btn-secondary">
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
