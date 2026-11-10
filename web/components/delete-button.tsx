"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm("Excluir esta transcrição? O resumo também será apagado.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/transcripts/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Falha ao excluir");
      }
      router.replace("/historico");
      router.refresh();
    } catch {
      setError("Não foi possível excluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="btn-secondary"
      >
        {busy ? "Excluindo..." : "Excluir transcrição"}
      </button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </div>
  );
}
