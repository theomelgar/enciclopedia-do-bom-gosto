"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRecommendations } from "@/hooks/use-recommendations";
import {
  useCollections,
  useCollection,
  useUpdateCollection,
  useDeleteCollection,
  useAddRecommendationToCollection,
} from "@/hooks/use-collections";
import { ErrorState } from "@/components/ErrorState";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";

export default function ColecaoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: all } = useCollections();
  const { data: collection, isLoading, error, refetch } = useCollection(id);
  const updateCollection = useUpdateCollection(id);
  const deleteCollection = useDeleteCollection();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const { data: searchResults } = useRecommendations({ q: addQuery, limit: 10 });
  const addRecommendation = useAddRecommendationToCollection(id);

  function startEdit() {
    setName(collection?.name ?? "");
    setEditing(true);
  }

  function saveEdit() {
    if (!name.trim()) return;
    updateCollection.mutate(name.trim(), { onSuccess: () => setEditing(false) });
  }

  function handleDelete() {
    deleteCollection.mutate(id, { onSuccess: () => router.push("/colecoes") });
  }

  if (isLoading) return <p className="p-4 text-neutral">Carregando...</p>;
  if (error || !collection) {
    return (
      <div className="p-4">
        <ErrorState message="Não achei essa coleção." onRetry={() => refetch()} />
      </div>
    );
  }

  // coleção atual sempre primeiro no scroll — nunca perder de vista onde você está
  const orderedCollections = all?.items
    ? [...all.items].sort((a, b) => (a.id === id ? -1 : b.id === id ? 1 : 0))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 p-4">
        <Link href="/colecoes" className="text-xl text-text">←</Link>
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              className="flex-1 rounded-lg border border-neutral/30 bg-surface px-3 py-1.5 text-text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button onClick={saveEdit} disabled={updateCollection.isPending} className="text-success">
              <Check size={18} />
            </button>
            <button onClick={() => setEditing(false)} className="text-neutral">
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <h1 className="flex-1 font-serif text-xl text-text truncate">{collection.name}</h1>
            <button onClick={startEdit} aria-label="Editar nome" className="text-neutral">
              <Pencil size={16} />
            </button>
            <button onClick={() => setConfirmDelete(true)} aria-label="Excluir coleção" className="text-destructive">
              <Trash2 size={16} />
            </button>
          </>
        )}
      </header>

      {/* scroll lateral de todas as coleções — a atual sempre em 1º */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-4">
        {orderedCollections.map((c) => (
          <Link
            key={c.id}
            href={`/colecao/${c.id}`}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-sm ${
              c.id === id ? "bg-primary text-white" : "bg-surface text-text"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* recommendations vinculadas — 1º slot é sempre o tile grande de adicionar */}
      <div className="flex flex-col gap-2 px-4">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral/30 py-6 text-primary-accent text-sm font-medium active:scale-[0.98] transition-transform"
        >
          <Plus size={20} /> Adicionar recomendação
        </button>

        {collection.recommendations.length === 0 && (
          <p className="text-sm text-neutral text-center py-2">Nenhuma recomendação nesta coleção ainda.</p>
        )}
        {collection.recommendations.map(({ recommendation: r }) => (
          <Link
            key={r.id}
            href={`/recomendacoes/${r.id}?fromCollectionName=${encodeURIComponent(collection.name)}`}
            className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-sm"
          >
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-primary/10">
              {r.photos[0]?.url ? (
                <img src={r.photos[0].url} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-lg">📌</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-text">{r.name}</p>
              {r.status === "WANT_TO_TRY" && (
                <span className="text-xs text-neutral">Quero experimentar</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
          <div className="w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-3 max-h-[80vh]">
            <header className="flex items-center justify-between">
              <h3 className="font-display text-text">Adicionar à coleção</h3>
              <button onClick={() => setShowAdd(false)} className="text-neutral text-xl leading-none">×</button>
            </header>
            <input
              autoFocus
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Buscar recomendação..."
              className="rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
            />
            <ul className="flex flex-col gap-1 overflow-y-auto">
              {searchResults?.items
                .filter((r) => !collection.recommendations.some((cr) => cr.recommendation.id === r.id))
                .map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => addRecommendation.mutate(r.id)}
                      disabled={addRecommendation.isPending}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface text-sm text-text disabled:opacity-50"
                    >
                      {r.name}
                    </button>
                  </li>
                ))}
              {addQuery && searchResults?.items.length === 0 && (
                <li className="text-neutral text-sm px-3 py-2">Nada encontrado.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-background p-4 shadow-md">
            <p className="mb-1 font-medium text-text">Excluir coleção?</p>
            <p className="mb-4 text-sm text-neutral">
              As recomendações não serão apagadas, só deixarão de pertencer a esta coleção.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg px-3 py-1.5 text-sm text-neutral"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-destructive px-3 py-1.5 text-sm text-white"
                onClick={handleDelete}
                disabled={deleteCollection.isPending}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}