"use client";

import { useState } from "react";
import Link from "next/link";
import { useCollections } from "@/hooks/use-collections";
import { useCreateCollection } from "@/hooks/use-create-collection";
import { ErrorState } from "@/components/ErrorState";
import { Plus } from "lucide-react";

export default function ColecoesPage() {
  const { data, isLoading, error, refetch } = useCollections();
  const createCollection = useCreateCollection();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createCollection.mutate(
      { name: trimmed },
      { onSuccess: () => { setName(""); setCreating(false); } }
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 p-4">
        <Link href="/home" className="text-xl text-text">←</Link>
        <h1 className="flex-1 font-serif text-xl text-text">Coleções</h1>
        <button
           aria-label="Nova coleção"
           onClick={() => setCreating(true)}
          className="text-primary-accent"
         >
          <Plus size={22} />
         </button>
       </header>

       {isLoading && <p className="px-4 text-neutral">Carregando...</p>}
       {error && <div className="p-4"><ErrorState onRetry={() => refetch()} /></div>}

      <div className="grid grid-cols-2 gap-3 p-4">
        {data?.items.map((c) => (
          <Link
            key={c.id}
            href={`/colecao/${c.id}`}
            className="relative flex aspect-square items-end overflow-hidden rounded-xl bg-primary shadow-sm"
          >
            {c.coverUrl ? (
              <img src={c.coverUrl} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-3xl">
                {c.icon ?? "📁"}
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="relative z-10 truncate p-2 font-serif text-sm text-white">
              {c.name}
            </span>
          </Link>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-background p-4 shadow-md">
            <p className="mb-3 font-display text-text">Nova coleção</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nome da coleção"
              className="w-full rounded-lg border border-neutral/30 bg-surface px-3 py-2 text-text"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-lg px-3 py-1.5 text-sm text-neutral"
                onClick={() => { setCreating(false); setName(""); }}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-60"
                onClick={handleCreate}
                disabled={createCollection.isPending || !name.trim()}
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}