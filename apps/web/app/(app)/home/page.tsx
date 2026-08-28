"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRecommendations } from "@/hooks/use-recommendations";
import { NearbySheet } from "@/components/NearbySheet";
import { useSuggestions } from "@/hooks/use-suggestions";
import { useCollections } from "@/hooks/use-collections";
import { ErrorState } from "@/components/ErrorState";
import { MapPin } from "lucide-react";
import Link from "next/link";

const VERDICT: Record<string, { icon: string; label: string; className: string }> = {
  RECOMMEND: { icon: "✅", label: "Recomendo", className: "bg-success/15 text-success" },
  EMERGENCY_ONLY: { icon: "⚠️", label: "Só em emergência", className: "bg-primary/10 text-primary-accent" },
  NOT_RECOMMEND: { icon: "❌", label: "Não recomendo", className: "bg-destructive/15 text-destructive" },
};

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [nearbyOpen, setNearbyOpen] = useState(false);

  const SORT_OPTIONS = [
    { value: "recent", label: "Recentes" },
    { value: "experiences_desc", label: "Mais experimentadas" },
    { value: "experiences_asc", label: "Menos experimentadas" },
    { value: "rating_desc", label: "Melhor avaliadas" },
    { value: "rating_asc", label: "Pior avaliadas" },
  ] as const;
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("recent");
  const { data, isLoading, error, refetch } = useRecommendations({ sort });
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestions();
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  
  const [isPending, startTransition] = useTransition();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  function goTo(id: string) {
    setNavigatingId(id);
    startTransition(() => router.push(`/recomendacoes/${id}`));
  }

  return (
    <main className="min-h-screen p-4 flex flex-col gap-8">
      <header>
         <input
           type="search"
           value={q}
           onChange={(e) => setQ(e.target.value)}
           onKeyDown={(e) => {
             if (e.key === "Enter" && q.trim()) router.push(`/busca?q=${encodeURIComponent(q.trim())}`);
           }}
           placeholder="Buscar recomendações..."
          className="w-full rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral shadow-sm"
         />
      </header>

      {/* Sugerido do dia — peça de destaque, único item determinístico (INV-010) */}
      {!suggestionsLoading && suggestions && suggestions.length > 0 && (
        <section>
          <h2 className="font-display text-sm tracking-wide uppercase text-neutral mb-2">
            Sugerido hoje
          </h2>
          {suggestions.map((s) => {
            const photo = s.photos[0]?.url;
            return (
              <button
                key={s.id}
                onClick={() => goTo(s.id)}
                disabled={isPending}
                className="w-full text-left block rounded-xl shadow-md relative overflow-hidden active:scale-[0.98] transition-transform disabled:opacity-70 h-40"
              >
                {photo ? (
                  <>
                    <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-primary" />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  {!photo && <span className="text-3xl block mb-1">{s.category?.icon ?? "✨"}</span>}
                  <p className="font-display text-xl">{s.name}</p>
                  {s.category?.name && <p className="text-white/70 text-sm">{s.category.name}</p>}
                </div>
                {navigatingId === s.id && isPending && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="h-6 w-6 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  </span>
                )}
              </button>
            );
          })}
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-sm tracking-wide uppercase text-neutral">Coleções</h2>
          <Link href="/colecoes" className="text-sm text-primary-accent">Ver todas →</Link>
        </div>
        {collectionsLoading && <p className="text-neutral text-sm">Carregando...</p>}
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
          {collections?.items.slice(0, 8).map((c) => (
            <Link
              key={c.id}
              href={`/colecao/${c.id}`}
              className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden shadow-sm bg-primary flex items-end"
            >
              {c.coverUrl ? (
                <img src={c.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-2xl">
                  {c.icon ?? "📁"}
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="relative z-10 p-1.5 text-[11px] leading-tight text-white truncate w-full">
                {c.name}
              </span>
            </Link>
          ))}
          <Link
            href="/colecoes"
            className="shrink-0 w-20 h-20 rounded-xl border border-dashed border-neutral/40 flex flex-col items-center justify-center text-neutral text-xs gap-1"
          >
            <span className="text-lg">→</span>
            Ver todas
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-sm tracking-wide uppercase text-neutral">Recomendações</h2>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="text-sm bg-surface rounded-full ms-1 text-center py-1 text-text"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {isLoading && <p className="text-neutral text-sm">Carregando...</p>}
        {error && <ErrorState onRetry={() => refetch()} />}
          <ul className="flex flex-col gap-2">
          {data?.items.map((rec) => {
            const v = rec.verdict ? VERDICT[rec.verdict] : null;
            const pending = rec.status === "WANT_TO_TRY";
            const photo = rec.photos[0]?.url;
            const navigating = navigatingId === rec.id && isPending;
            return (
              <li key={rec.id}>
                <button
                  onClick={() => goTo(rec.id)}
                  disabled={isPending}
                  className="w-full text-left rounded-xl bg-surface px-3 py-3 flex items-center gap-3 shadow-sm relative overflow-hidden active:scale-[0.98] transition-transform disabled:opacity-70"
                >
                  <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center ring-1 ring-black/5">
                    {photo ? (
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl">🍽️</span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-text truncate">{rec.name}</span>
                    {pending && <span className="text-xs text-neutral">Quero experimentar</span>}
                  </div>
                  {v && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${v.className}`}>
                      {v.icon} {v.label}
                    </span>
                  )}
                  {navigating && (
                    <span className="absolute inset-0 flex items-center justify-center bg-surface/80">
                      <span className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <button
        aria-label="Perto de mim"
        onClick={() => setNearbyOpen(true)}
        className="fixed right-4 z-20 rounded-full bg-surface shadow-md h-12 w-12 bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-6 flex items-center justify-center"
       >
        <MapPin size={20} className="text-primary" />
      </button>
      {nearbyOpen && <NearbySheet onClose={() => setNearbyOpen(false)} />}
    </main>
  );
}