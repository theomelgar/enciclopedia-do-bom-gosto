"use client";

// Tela "Recommendation" — reorganizada em tabs (V3 §7): topo = identidade, tabs = Onde/Comprar/Exp.
import { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRecommendation, useSetVerdict, useUpdateRecommendation, useDeleteRecommendation } from "@/hooks/use-recommendation";
import { CategoryAutocomplete } from "@/components/CategoryAutocomplete";
import { useRecommendationCategories } from "@/hooks/use-categories";import { useCollections, useAddToCollection, useRemoveFromCollection } from "@/hooks/use-collections";
import { useBrands, useCreateBrand, useSetRecommendationBrand } from "@/hooks/use-brands";
import { useAddPurchaseLink, useRemovePurchaseLink } from "@/hooks/use-purchase-links";
import { useUploadPhoto, useDeletePhoto } from "@/hooks/use-photos";
import { useAddExperience } from "@/hooks/use-experiences";
import { usePlaceDedup, useCreatePlace, useLinkPlace, useUnlinkPlace } from "@/hooks/use-quick-add";
import { useAddPriceEntry } from "@/hooks/use-price-entries";
import { useDebounce } from "@/hooks/use-debounce";
import { Lightbox } from "@/components/Lightbox";
import type { Verdict } from "@ebg/shared-types";
import { Navigation, X as XIcon, Check, Trash2, Link as LinkIcon, Pencil, Share2, MoveLeft  } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { useUpdateExperience } from "@/hooks/use-experiences";
import { buildShareText } from "@/lib/share-text";
import { useCreateShareCode } from "@/hooks/use-share";

const VERDICT_ICON: Record<string, string> = {
  NOT_RECOMMEND: "❌",
  EMERGENCY_ONLY: "⚠️",
  RECOMMEND: "✅",
};
const VERDICT_LABEL: Record<string, string> = {
  RECOMMEND: "Recomendo",
  EMERGENCY_ONLY: "Só em emergência",
  NOT_RECOMMEND: "Não recomendo",
};
const TABS = [
  { key: "onde", label: "Onde" },
  { key: "comprar", label: "Comprar" },
  { key: "exp", label: "Experiências" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function directionsUrl(place: { name: string; address: string | null; latitude: number | null; longitude: number | null }) {
  const query =
    place.latitude != null && place.longitude != null
      ? `${place.latitude},${place.longitude}`
      : place.address ?? place.name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function RecommendationDetailPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><p className="text-neutral">Carregando...</p></main>}>
      <RecommendationDetailContent />
    </Suspense>
  );
}

function RecommendationDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: rec, isLoading, error, refetch } = useRecommendation(id);
  const searchParams = useSearchParams();
  const fromCollectionName = searchParams.get("fromCollectionName");

  const setVerdict = useSetVerdict(id);
  const updateRecommendation = useUpdateRecommendation(id);
  const [showCategoryEdit, setShowCategoryEdit] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [showVerdictForm, setShowVerdictForm] = useState(false);
  const [verdict, setVerdictValue] = useState<Verdict>("RECOMMEND");
  const [rating, setRating] = useState(5);

  const createShareCode = useCreateShareCode(id);

  const { data: allCollections } = useCollections();
  const addToCollection = useAddToCollection(id);
  const removeFromCollection = useRemoveFromCollection(id);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  // --- Brand ---
  const { data: brands } = useBrands();
  const createBrand = useCreateBrand();
  const setBrand = useSetRecommendationBrand(id);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  // --- PurchaseLink ---
  const addLink = useAddPurchaseLink(id);
  const removeLink = useRemovePurchaseLink(id);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // --- Photo ---
  const uploadPhoto = useUploadPhoto(id);

  // --- Experience ---
  const addExperience = useAddExperience(id);
  const updateExperience = useUpdateExperience(id);
  const [showExpForm, setShowExpForm] = useState(false);
  const [expRating, setExpRating] = useState(5);
  const [expComment, setExpComment] = useState("");
  const [expPlaceId, setExpPlaceId] = useState<string>("");
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  // --- Place ---
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const debouncedPlaceName = useDebounce(placeName);
  const placeDedup = usePlaceDedup(debouncedPlaceName);
  const createPlace = useCreatePlace();
  const linkPlace = useLinkPlace(id);
  const unlinkPlace = useUnlinkPlace(id);

  // --- Price ---
  const addPriceEntry = useAddPriceEntry(id);
  const [priceFormPlaceId, setPriceFormPlaceId] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState("");

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("onde");

  // confirmação leve pra ações destrutivas (Nielsen 3) — substitui o ícone único por confirmar/cancelar
  const [confirmUnlinkId, setConfirmUnlinkId] = useState<string | null>(null);
  const [confirmRemoveLinkId, setConfirmRemoveLinkId] = useState<string | null>(null);
  const deletePhoto = useDeletePhoto(id);
  const deleteRecommendation = useDeleteRecommendation(id);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
  const [confirmDeleteRec, setConfirmDeleteRec] = useState(false);

  async function handleCreateAndLinkPlace() {
    const place = await createPlace.mutateAsync({ name: placeName });
    await linkPlace.mutateAsync({ placeId: place.id });
    setPlaceName("");
    setShowPlaceForm(false);
  }

  function handleSavePrice(placeId: string) {
      const trimmed = priceValue.trim();
      if (trimmed === "") return;
      const price = Number(trimmed.replace(",", "."));
      if (Number.isNaN(price) || price < 0) return;
      addPriceEntry.mutate(
        { placeId, price },
       { onSuccess: () => { setPriceFormPlaceId(null); setPriceValue(""); } },
     );
   }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral">Carregando...</p>
      </main>
    );
  }
  if (error || !rec) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <ErrorState message="Não achei essa recomendação." onRetry={() => refetch()} />
      </main>
    );
  }
  const linkedIds = new Set(rec.collections.map((c) => c.collection.id));

  async function handleShare() {
    if (!rec) return;
    const { code } = await createShareCode.mutateAsync();
    const text = buildShareText(rec, code);
    if (navigator.share) {
      try { await navigator.share({ text, title: rec.name }); } catch { /* usuário cancelou — ok */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Identidade — sempre visível */}
      <div className="p-4 flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <button aria-label="Voltar" onClick={() => router.back()} className="text-2xl">
            <MoveLeft size={20}/>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl text-text truncate">{rec.name}</h1>
            {fromCollectionName && (
              <p className="text-xs text-neutral">em: {decodeURIComponent(fromCollectionName)}</p>
            )}
          </div>
          <button aria-label="Compartilhar" onClick={handleShare} className="text-primary-accent">
            <Share2 size={20} />
          </button>
          <button aria-label="Excluir recomendação" onClick={() => setConfirmDeleteRec(true)} className="text-destructive">
            <Trash2 size={20} />
          </button>
        </header>

          {confirmDeleteRec && (
            <div className="rounded-xl bg-destructive/10 p-4 flex flex-col gap-2">
              <p className="text-sm text-text">
                Excluir <strong>{rec.name}</strong>? Essa ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <button
                  disabled={deleteRecommendation.isPending}
                  onClick={() => deleteRecommendation.mutate(undefined, { onSuccess: () => router.push("/") })}
                  className="rounded-xl bg-destructive text-white py-2 px-4 text-sm disabled:opacity-60"
                >
                  {deleteRecommendation.isPending ? "Excluindo..." : "Confirmar exclusão"}
                </button>
                <button onClick={() => setConfirmDeleteRec(false)} className="text-neutral text-sm px-3">
                  cancelar
                </button>
              </div>
            </div>
          )}
        <section className="flex items-center gap-2 flex-wrap">
          {rec.verdict ? (
            <span className="text-sm px-3 py-1 rounded-full bg-surface font-medium text-text">
              {VERDICT_ICON[rec.verdict]} {VERDICT_LABEL[rec.verdict]}
            </span>
          ) : (
            <span className="text-neutral text-sm rounded-full bg-surface px-3 py-1">
              Quero experimentar
            </span>
          )}
          {rec.rating && <span className="text-text text-sm">★ {rec.rating}</span>}
          {!showCategoryEdit && (
            <button
              onClick={() => { setCategoryDraft(rec.category?.name ?? ""); setShowCategoryEdit(true); }}
              className="text-sm text-neutral rounded-full bg-surface px-3 py-1"
            >
              {rec.category ? rec.category.name : "+ categoria"}
            </button>
          )}
        </section>
        {showCategoryEdit && (
          <section className="flex flex-col gap-2 rounded-xl bg-surface p-4">
            <CategoryAutocomplete
              value={categoryDraft}
              onChange={setCategoryDraft}
              useSearch={useRecommendationCategories}
            />
            <div className="flex gap-2">
              <button
                disabled={updateRecommendation.isPending}
                onClick={() =>
                  updateRecommendation.mutate(
                    categoryDraft.trim() ? { categoryName: categoryDraft.trim() } : { categoryId: null },
                    { onSuccess: () => setShowCategoryEdit(false) },
                  )
                }
                className="flex-1 rounded-xl bg-primary text-white py-2 text-sm disabled:opacity-60"
              >
                {updateRecommendation.isPending ? "Salvando..." : "Salvar"}
              </button>
              <button onClick={() => setShowCategoryEdit(false)} className="text-neutral text-sm px-3">
                cancelar
              </button>
            </div>
          </section>
        )}

        {rec.description && <p className="text-text">{rec.description}</p>}

        {!rec.verdict && !showVerdictForm && (
          <button
            onClick={() => setShowVerdictForm(true)}
            className="rounded-xl bg-primary text-white py-3 font-medium"
          >
            Já experimentei — dar veredito
          </button>
        )}

        {showVerdictForm && (
          <div className="flex flex-col gap-3 rounded-xl bg-surface p-4">
            <div className="flex gap-2">
              {(["NOT_RECOMMEND", "EMERGENCY_ONLY", "RECOMMEND"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVerdictValue(v)}
                  className={`flex-1 rounded-xl py-2 text-sm ${
                    verdict === v ? "bg-primary text-white" : "bg-background text-text"
                  }`}
                >
                  {VERDICT_ICON[v]}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={0.5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
            <span className="text-center text-text">★ {rating}</span>
            <button
              disabled={setVerdict.isPending}
              onClick={() => setVerdict.mutate({ verdict, rating }, { onSuccess: () => setShowVerdictForm(false) })}
              className="rounded-xl bg-primary text-white py-3 font-medium disabled:opacity-60"
            >
              {setVerdict.isPending ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        )}

        <section>
          <h2 className="font-display text-sm text-neutral uppercase tracking-wide mb-2">Coleções</h2>
          <div className="flex gap-2 flex-wrap items-center">
            {rec.collections.map((c) => (
              <button
                key={c.collection.id}
                onClick={() => removeFromCollection.mutate(c.collection.id)}
                disabled={removeFromCollection.isPending}
                className="rounded-full bg-surface px-3 py-1 text-sm disabled:opacity-50"
                title="Remover da coleção"
              >
                {c.collection.icon ? `${c.collection.icon} ` : ""}{c.collection.name} {removeFromCollection.isPending ? "..." : "✕"}
              </button>
            ))}
            <button
              onClick={() => setShowCollectionPicker((v) => !v)}
              className="rounded-full bg-surface px-3 py-1 text-sm text-primary-accent"
            >
              + adicionar
            </button>
          </div>

          {showCollectionPicker && (
            <ul className="mt-2 flex flex-col gap-1 rounded-xl bg-surface p-2">
              {allCollections?.items
                .filter((c) => !linkedIds.has(c.id))
                .map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => addToCollection.mutate(c.id, { onSuccess: () => setShowCollectionPicker(false) })}
                      disabled={addToCollection.isPending}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-background rounded-lg disabled:opacity-50"
                    >
                      {addToCollection.isPending ? "Adicionando..." : `${c.icon ? c.icon + " " : ""}${c.name}`}
                    </button>
                  </li>
                ))}
              {allCollections?.items.filter((c) => !linkedIds.has(c.id)).length === 0 && (
                <li className="text-neutral text-sm px-2 py-1">Nenhuma coleção disponível.</li>
              )}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-sm text-neutral uppercase tracking-wide mb-2">Marca</h2>
          {rec.brand ? (
            <button
              onClick={() => setBrand.mutate(null)}
              disabled={setBrand.isPending}
              className="rounded-full bg-surface px-3 py-1 text-sm disabled:opacity-50"
              title="Remover marca"
            >
              {rec.brand.name} {setBrand.isPending ? "..." : "✕"}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowBrandPicker((v) => !v)}
                className="rounded-full bg-surface px-3 py-1 text-sm text-primary-accent"
              >
                + adicionar marca
              </button>
              {showBrandPicker && (
                <div className="mt-2 flex flex-col gap-2">
                  <ul className="flex flex-col gap-1 rounded-xl bg-surface p-2">
                    {brands?.items.map((b) => (
                      <li key={b.id}>
                        <button
                          onClick={() => setBrand.mutate(b.id, { onSuccess: () => setShowBrandPicker(false) })}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-background rounded-lg"
                        >
                          {b.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <input
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Nova marca..."
                      className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm"
                    />
                    <button
                      onClick={async () => {
                        if (!newBrandName.trim()) return;
                        const b = await createBrand.mutateAsync(newBrandName.trim());
                        setBrand.mutate(b.id, { onSuccess: () => setShowBrandPicker(false) });
                        setNewBrandName("");
                      }}
                      className="rounded-xl bg-primary text-white px-3 text-sm"
                    >
                      Criar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section>
          <h2 className="font-display text-sm text-neutral uppercase tracking-wide mb-2">Fotos</h2>
          <div className="flex gap-2 flex-wrap">
            {rec.photos.map((p) => (
              <div key={p.id} className="relative w-40 h-40">
                <img
                  src={p.url}
                  alt=""
                  onClick={() => setLightboxUrl(p.url)}
                  className="w-40 h-40 object-cover rounded-xl cursor-pointer hover:opacity-80"
                />
                {confirmDeletePhotoId === p.id ? (
                  <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center gap-4">
                    <button
                      aria-label="Confirmar exclusão da foto"
                      disabled={deletePhoto.isPending}
                      onClick={() => { deletePhoto.mutate(p.id); setConfirmDeletePhotoId(null); }}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-destructive text-white"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      aria-label="Cancelar"
                      onClick={() => setConfirmDeletePhotoId(null)}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white/90 text-neutral"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    aria-label="Excluir foto"
                    onClick={() => setConfirmDeletePhotoId(p.id)}
                    className="absolute -top-1.5 -right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-destructive text-white shadow-sm"
                  >
                    <XIcon size={12} />
                  </button>
                )}
              </div>
            ))}
            <label className="w-40 h-40 rounded-xl bg-surface flex items-center justify-center text-primary cursor-pointer">
              {uploadPhoto.isPending ? (
                <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-2xl">+</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadPhoto.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto.mutate(file);
                }}
              />
            </label>
          </div>
        </section>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 bg-background border-b border-black/5 z-10">
        <div className="flex px-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? "border-primary-accent text-primary-accent" : "border-transparent text-neutral"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {tab === "onde" && (
          <section>
            {rec.places.length === 0 && <p className="text-neutral text-sm">Nenhum local vinculado ainda.</p>}
            <ul className="flex flex-col gap-2">
              {rec.places.map((rp) => (
                <li key={rp.id} className="rounded-xl bg-surface p-4 flex flex-col gap-3">
                  {/* cabeçalho: identidade do local */}
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => router.push(`/locais/${rp.place.id}`)}
                      className="flex flex-col text-left min-w-0"
                    >
                      <span className="text-text font-medium truncate">{rp.place.name}</span>
                      {rp.place.address && (
                        <span className="text-sm text-neutral truncate">{rp.place.address}</span>
                      )}
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      
                      <a  href={directionsUrl(rp.place)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Como chegar"
                        className="h-9 w-9 flex items-center justify-center rounded-full bg-background text-primary"
                      >
                        <Navigation size={16} />
                      </a>
                      {confirmUnlinkId === rp.place.id ? (
                        <>
                          <button
                            onClick={() => { unlinkPlace.mutate(rp.place.id); setConfirmUnlinkId(null); }}
                            disabled={unlinkPlace.isPending}
                            aria-label="Confirmar desvincular"
                            className="h-9 w-9 flex items-center justify-center rounded-full bg-destructive text-white"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmUnlinkId(null)}
                            aria-label="Cancelar"
                            className="h-9 w-9 flex items-center justify-center rounded-full bg-background text-neutral"
                          >
                            <XIcon size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmUnlinkId(rp.place.id)}
                          aria-label="Desvincular"
                          className="h-9 w-9 flex items-center justify-center rounded-full bg-background text-destructive"
                        >
                          <XIcon size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* preço: maior peso da linha — é a resposta que a pessoa veio buscar */}
                  <div className="flex items-center justify-between border-t border-black/5 pt-3">
                    {rp.lastPrice != null ? (
                      <span className="text-text text-lg font-semibold">
                        {Number(rp.lastPrice) === 0 ? "Grátis" : `R$ ${rp.lastPrice}`}
                      </span>
                    ) : (
                      <span className="text-neutral text-sm">Sem preço registrado</span>
                    )}
                    {priceFormPlaceId !== rp.place.id && (
                      <button
                        onClick={() => { setPriceFormPlaceId(rp.place.id); setPriceValue(""); }}
                        className="text-primary-accent text-sm font-medium"
                      >
                        {rp.lastPrice != null ? "atualizar" : "+ registrar"}
                      </button>
                    )}
                  </div>

                  {priceFormPlaceId === rp.place.id && (
                    <>
                      <input
                          autoFocus
                          inputMode="decimal"
                          value={priceValue}
                          onChange={(e) => setPriceValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSavePrice(rp.place.id)}
                          placeholder="0,00"
                          className="flex-1 rounded-xl bg-background px-3 py-2 text-sm"
                        />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPriceValue("0")}
                          className="rounded-xl bg-background px-3 text-sm text-neutral"
                        >
                          Grátis
                        </button>
                        <button
                          disabled={!priceValue.trim() || addPriceEntry.isPending}
                          onClick={() => handleSavePrice(rp.place.id)}
                          className="rounded-xl bg-primary text-white px-4 text-sm disabled:opacity-40"
                        >
                          {addPriceEntry.isPending ? "..." : "Salvar"}
                        </button>
                        <button onClick={() => setPriceFormPlaceId(null)} className="text-neutral text-sm px-2">
                          cancelar
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {!showPlaceForm ? (
              <button onClick={() => setShowPlaceForm(true)} className="mt-3 text-sm text-primary-accent">
                + vincular local
              </button>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <input
                  autoFocus
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="Nome do local"
                  className="rounded-xl bg-surface px-4 py-3 text-sm"
                />
                {placeDedup.data && placeDedup.data.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-neutral">Já existe — é esse?</p>
                    {placeDedup.data.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => linkPlace.mutate({ placeId: c.id }, { onSuccess: () => setShowPlaceForm(false) })}
                        disabled={linkPlace.isPending}
                        className="text-left rounded-xl bg-surface px-4 py-2 text-sm disabled:opacity-50"
                      >
                        {linkPlace.isPending ? "Vinculando..." : c.name}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  disabled={!placeName.trim() || createPlace.isPending || linkPlace.isPending}
                  onClick={handleCreateAndLinkPlace}
                  className="rounded-xl bg-primary text-white py-2 text-sm disabled:opacity-40"
                >
                  Criar novo local e vincular
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "comprar" && (
          <section>
            {rec.purchaseLinks.length === 0 && <p className="text-neutral text-sm">Nenhum link ainda.</p>}
            <ul className="flex flex-col gap-2">
               {rec.purchaseLinks.map((link) => (
                 <li key={link.id} className="rounded-xl bg-surface px-4 py-3 flex justify-between items-center">
                  <a href={link.url} target="_blank" rel="noreferrer" className="flex-1 flex items-center gap-2">
                    <LinkIcon size={14} className="text-primary-accent" /> {link.label}
                   </a>
                  {confirmRemoveLinkId === link.id ? (
                    <span className="flex items-center gap-2">
                      <button
                        onClick={() => { removeLink.mutate(link.id); setConfirmRemoveLinkId(null); }}
                        className="text-destructive text-xs font-medium"
                      >
                        confirmar
                      </button>
                      <button onClick={() => setConfirmRemoveLinkId(null)} className="text-neutral text-xs">
                        cancelar
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveLinkId(link.id)}
                      disabled={removeLink.isPending}
                      className="text-destructive text-sm disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                 </li>
               ))}
             </ul>
             {!showLinkForm ? (
              <button onClick={() => setShowLinkForm(true)} className="mt-3 text-sm text-primary-accent">
                 + adicionar link
              </button>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Ex: Amazon" className="rounded-xl bg-surface px-4 py-2 text-sm" />
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="rounded-xl bg-surface px-4 py-2 text-sm" />
                <button
                  disabled={!linkUrl.trim() || addLink.isPending}
                  onClick={() => addLink.mutate({ label: linkLabel || "Link", url: linkUrl, kind: "OTHER" }, { onSuccess: () => { setShowLinkForm(false); setLinkLabel(""); setLinkUrl(""); } })}
                  className="rounded-xl bg-primary text-white py-2 text-sm disabled:opacity-40"
                >
                  Salvar link
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "exp" && (
          <section>
            {rec.experiences.length === 0 && <p className="text-neutral text-sm">Nenhuma ainda.</p>}
            <ul className="flex flex-col gap-2">
               {rec.experiences.map((exp) => (
                 <li key={exp.id} className="rounded-xl bg-surface px-4 py-3">
                  {editingExpId === exp.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="range" min={1} max={5}
                        value={expRating}
                        onChange={(e) => setExpRating(Number(e.target.value))}
                      />
                      <span className="text-sm text-center">★ {expRating}</span>
                      <textarea
                        value={expComment}
                        onChange={(e) => setExpComment(e.target.value)}
                        placeholder="Comentário (opcional)"
                        className="rounded-xl bg-background px-3 py-2 text-sm"
                      />
                      {rec.places.length > 0 && (
                        <select
                          value={expPlaceId}
                          onChange={(e) => setExpPlaceId(e.target.value)}
                          className="rounded-xl bg-background px-3 py-2 text-sm text-text"
                        >
                          <option value="">Onde foi? (opcional)</option>
                          {rec.places.map((rp) => (
                            <option key={rp.place.id} value={rp.place.id}>{rp.place.name}</option>
                          ))}
                        </select>
                      )}
                      <div className="flex gap-2">
                        <button
                          disabled={updateExperience.isPending}
                          onClick={() =>
                            updateExperience.mutate(
                              { expId: exp.id, rating: expRating, comment: expComment || undefined, placeId: expPlaceId || null },
                              { onSuccess: () => setEditingExpId(null) },
                            )
                          }
                          className="rounded-xl bg-primary text-white px-4 py-1.5 text-sm disabled:opacity-60"
                        >
                          {updateExperience.isPending ? "Salvando..." : "Salvar"}
                        </button>
                        <button onClick={() => setEditingExpId(null)} className="text-neutral text-sm px-2">
                          cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-neutral">{exp.author.name} · ★{exp.rating}</p>
                        <div className="flex items-center gap-3 shrink-0">
                          {exp.place && (
                            <button
                              onClick={() => router.push(`/locais/${exp.place!.id}`)}
                              className="text-xs text-primary-accent"
                            >
                              {exp.place.name}
                            </button>
                          )}
                          <button
                            aria-label="Editar experiência"
                            onClick={() => {
                              setEditingExpId(exp.id);
                              setExpRating(exp.rating);
                              setExpComment(exp.comment ?? "");
                              setExpPlaceId(exp.place?.id ?? "");
                            }}
                            className="text-neutral"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      </div>
                      {exp.comment && <p className="text-text">{exp.comment}</p>}
                    </>
                  )}
                 </li>
               ))}
             </ul>
            {!showExpForm ? (
              <button onClick={() => setShowExpForm(true)} className="mt-3 text-sm text-primary-accent">
                 + nova experiência
              </button>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <input type="range" min={1} max={5} value={expRating} onChange={(e) => setExpRating(Number(e.target.value))} />
                <span className="text-sm text-center">★ {expRating}</span>
                <textarea value={expComment} onChange={(e) => setExpComment(e.target.value)} placeholder="Comentário (opcional)" className="rounded-xl bg-surface px-4 py-2 text-sm" />
                {rec.places.length > 0 && (
                  <select
                    value={expPlaceId}
                    onChange={(e) => setExpPlaceId(e.target.value)}
                    className="rounded-xl bg-surface px-4 py-2 text-sm text-text"
                  >
                    <option value="">Onde foi? (opcional)</option>
                    {rec.places.map((rp) => (
                      <option key={rp.place.id} value={rp.place.id}>
                        {rp.place.name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  disabled={addExperience.isPending}
                  onClick={() =>
                    addExperience.mutate(
                      { rating: expRating, comment: expComment || undefined, placeId: expPlaceId || undefined },
                      { onSuccess: () => { setShowExpForm(false); setExpComment(""); setExpPlaceId(""); } },
                    )
                  }
                  className="rounded-xl bg-primary text-white py-2 text-sm disabled:opacity-60"
                >
                  Salvar
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </main>
  );
}