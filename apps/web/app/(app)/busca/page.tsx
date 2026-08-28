"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRecommendations } from "@/hooks/use-recommendations";
import { ErrorState } from "@/components/ErrorState";
import { useRecommendationCategories } from "@/hooks/use-categories";

const VERDICT_ICON: Record<string, string> = {
  NOT_RECOMMEND: "❌",
  EMERGENCY_ONLY: "⚠️",
  RECOMMEND: "✅",
};

function BuscaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const collectionId = searchParams.get("collectionId") ?? undefined;
  const [categoryId, setCategoryId] = useState<string | undefined>(
    searchParams.get("categoryId") ?? undefined,
  );
  const { data: categories } = useRecommendationCategories("");
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const { data, isLoading, error, refetch } = useRecommendations({ q, collectionId, limit: 20 });

  return (
    <main className="min-h-screen p-4 flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <button aria-label="Voltar" onClick={() => router.back()} className="text-2xl">←</button>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar recomendações..."
          className="flex-1 rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
          autoFocus
        />
      </header>
        {categories && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          <button
            onClick={() => setCategoryId(undefined)}
            className={`shrink-0 min-h-11 flex items-center rounded-full px-4 text-sm border active:scale-[0.98] ${
              categoryId === undefined
                ? "bg-primary text-white border-primary"
                : "bg-surface text-text border-neutral/20"
            }`}
          >
            Todas
          </button>
          {categories.map((c) => {
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryId(active ? undefined : c.id)}
                className={`shrink-0 min-h-11 flex items-center rounded-full px-4 text-sm border active:scale-[0.98] ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-text border-neutral/20"
                }`}
              >
                {c.icon ? `${c.icon} ` : ""}{c.name}
              </button>
            );
          })}
        </div>
      )}
      {isLoading && <p className="text-neutral text-sm">Carregando...</p>}
      {error && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && data?.items.length === 0 && (
        <p className="text-neutral text-sm">Nada encontrado.</p>
      )}

      <ul className="flex flex-col gap-2">
        {data?.items.map((rec) => (
          <li key={rec.id}>
            <Link
              href={`/recomendacoes/${rec.id}`}
              className="rounded-xl bg-surface px-4 py-3 flex justify-between"
            >
              <span>{rec.name}</span>
              {rec.verdict && <span>{VERDICT_ICON[rec.verdict]}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function BuscaPage() {
  return (
    <Suspense fallback={<p className="p-4 text-neutral text-sm">Carregando...</p>}>
      <BuscaContent />
    </Suspense>
  );
}