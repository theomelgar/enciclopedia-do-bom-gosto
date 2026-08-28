"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useImportPreview, useConfirmImport } from "@/hooks/use-share";

export function ImportCodeModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const preview = useImportPreview(code.toUpperCase());
  const confirmImport = useConfirmImport();
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-lg text-primary">Importar por código</h2>
          <button onClick={onClose} className="text-neutral text-xl leading-none">×</button>
        </header>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="ABC123"
          className="rounded-xl bg-surface px-4 py-3 text-center text-lg tracking-widest text-text placeholder:text-neutral"
        />

        {preview.isError && <p className="text-sm text-destructive">Código inválido ou expirado.</p>}

        {preview.data && (
          <div className="rounded-xl bg-surface p-4 flex flex-col gap-1">
            <p className="text-text font-medium">{preview.data.name}</p>
            {preview.data.category && <p className="text-sm text-neutral">{preview.data.category}</p>}
            {preview.data.places.map((p, i) => (
              <p key={i} className="text-sm text-text">
                📍 {p.name}{p.address ? ` — ${p.address}` : ""}
              </p>
            ))}
            {preview.data.purchaseLinks.map((l, i) => (
              <p key={i} className="text-sm text-text">🌐 {l.label}</p>
            ))}
            <p className="text-xs text-primary-accent mt-1">{preview.data.sourceLabel}</p>
          </div>
        )}

        <button
          disabled={!preview.data || confirmImport.isPending}
          onClick={() =>
            confirmImport.mutate(code, { onSuccess: (rec: any) => router.push(`/recomendacoes/${rec.id}`) })
          }
          className="rounded-xl bg-primary text-white py-3 font-medium disabled:opacity-40"
        >
          {confirmImport.isPending ? "Adicionando..." : "Adicionar ao meu Espaço"}
        </button>
      </div>
    </div>
  );
}