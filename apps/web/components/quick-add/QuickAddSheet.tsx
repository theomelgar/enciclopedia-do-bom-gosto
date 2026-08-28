"use client";

// Cadastro relâmpago — fluxo canônico em proposta-enciclopedia-do-bom-gosto-v3.md §6
// (FAB -> buscar Recommendation -> [abrir existente | criar nova] -> keywords -> origem -> salvar).
// Meta: INV-008 (<1min) — cada passo pede o mínimo possível, tudo mais fica pra depois.

import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useAddressSearch, type AddressSuggestion } from "@/hooks/use-address-search";
import {
  useRecommendationDedup,
  usePlaceDedup,
  useCreateRecommendation,
  useCreatePlace,
  useLinkPlace,
} from "@/hooks/use-quick-add";
import { useAddPurchaseLink } from "@/hooks/use-purchase-links";
import { PlaceMap } from "@/components/PlaceMap";
import { CategoryAutocomplete } from "../CategoryAutocomplete";
import { useRecommendationCategories } from "@/hooks/use-categories";
import { Search, Tag, Hash, MapPin, Globe2 } from "lucide-react";
import { ImportCodeModal } from "@/components/ImportCodeModal";

type Step = "search" | "create" | "keywords" | "source" | "place" | "link" | "done";

interface QuickAddSheetProps {
  onClose: () => void;
}

export function QuickAddSheet({ onClose }: QuickAddSheetProps) {
  const [step, setStep] = useState<Step>("search");
  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [recommendationName, setRecommendationName] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState("");  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showImport, setShowImport] = useState(false);

  const debouncedName = useDebounce(name);
  const dedup = useRecommendationDedup(debouncedName);
  const createRecommendation = useCreateRecommendation();

  const debouncedPlaceName = useDebounce(placeName);
  const placeDedup = usePlaceDedup(debouncedPlaceName, selectedAddress?.latitude, selectedAddress?.longitude);
  const addressSearch = useAddressSearch(selectedAddress ? "" : debouncedPlaceName);
  const createPlace = useCreatePlace();
  const linkPlace = useLinkPlace(recommendationId ?? "");
  const addPurchaseLink = useAddPurchaseLink(recommendationId ?? "");

  function addKeyword() {
    const label = keywordInput.trim();
    if (label && !keywords.includes(label)) setKeywords([...keywords, label]);
    setKeywordInput("");
  }

  async function handleCreateRecommendation() {
    const rec = await createRecommendation.mutateAsync({
      name,
      categoryName: categoryName.trim() || undefined,
      keywords,
      status: "WANT_TO_TRY", 
    });
    setRecommendationId(rec.id);
    setRecommendationName(rec.name);
    setStep("source");
  }

    async function handleLinkExistingPlace(placeId: string) {
      await linkPlace.mutateAsync({ placeId });
      setStep("done");
    }

  async function handleCreateAndLinkPlace() {
    const place = await createPlace.mutateAsync({
      name: placeName,
      address: selectedAddress?.label ?? (manualAddress.trim() || undefined),
      latitude: selectedAddress?.latitude,
      longitude: selectedAddress?.longitude,
    });
    await linkPlace.mutateAsync({ placeId: place.id });
    setStep("done");
  }

  async function handleAddLink() {
    await addPurchaseLink.mutateAsync({ label: linkLabel || "Link", url: linkUrl, kind: "OTHER" });
    setStep("done");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl p-5 pb-8 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-lg text-primary">Nova recomendação</h2>
          <button aria-label="Fechar" onClick={onClose} className="text-neutral text-xl leading-none">
            ×
          </button>
        </header>
        {(["search", "create", "keywords", "source"] as Step[]).includes(step) && (
          <div className="flex gap-1">
            {(["search", "create", "keywords", "source"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  (["search", "create", "keywords", "source"] as Step[]).indexOf(step) >= i ? "bg-primary" : "bg-surface"
                }`}
              />
            ))}
          </div>
        )}
        {step === "search" && (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-neutral font-medium">
              <Search size={13} /> O que você quer registrar?
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pizza Portuguesa, MacBook Air..."
              className="rounded-xl bg-surface px-4 py-3 text-base text-text placeholder:text-neutral"
            />

            {dedup.data && dedup.data.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-neutral">Já existe algo parecido — é isso?</p>
                {dedup.data.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setRecommendationId(c.id);
                      setRecommendationName(c.name);
                      setStep("source");
                    }}
                    className="text-left rounded-xl bg-surface px-4 py-3 hover:bg-surface/70"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <button
              disabled={name.trim().length < 1}
              onClick={() => setStep("create")}
              className="rounded-xl bg-primary text-white py-3 font-medium disabled:opacity-40"
            >
              {dedup.data && dedup.data.length > 0 ? "Não é nenhuma, criar nova" : "Continuar"}
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="text-center text-sm text-primary-accent"
            >
              Tenho um código de compartilhamento
            </button>
          </div>
        )}

        {step === "create" && (
          <div className="flex flex-col gap-3">
            <p className="text-text font-medium">{name}</p>
            <label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-neutral font-medium">
              <Tag size={13} /> Categoria (opcional)
            </label>
            <CategoryAutocomplete
              value={categoryName}
              onChange={setCategoryName}
              useSearch={useRecommendationCategories}
            />
            <button
              onClick={() => setStep("keywords")}
              className="rounded-xl bg-primary text-white py-3 font-medium"
            >
              Continuar
            </button>
          </div>
        )}

        {step === "keywords" && (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-neutral font-medium">
              <Hash size={13} /> Quando preciso de...
            </label>
            <div className="flex gap-2">
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Ex: jantar, delivery"
                className="flex-1 rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
              />
              <button onClick={addKeyword} className="rounded-xl bg-surface px-4 text-primary font-medium">
                +
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((k) => (
                  <span
                    key={k}
                    onClick={() => setKeywords(keywords.filter((kw) => kw !== k))}
                    className="rounded-full bg-surface px-3 py-1 text-sm cursor-pointer"
                  >
                    {k} ×
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={handleCreateRecommendation}
              disabled={createRecommendation.isPending}
              className="rounded-xl bg-primary text-white py-3 font-medium disabled:opacity-60"
            >
              {createRecommendation.isPending ? "Salvando..." : "Salvar e continuar"}
            </button>
          </div>
        )}

        {step === "source" && (
          <div className="flex flex-col gap-3">
            <p className="text-text font-medium">{recommendationName}</p>
            <label className="text-sm text-neutral">Onde encontrou (opcional agora)</label>
            <button
              onClick={() => setStep("place")}
              className="flex items-center gap-2 rounded-xl bg-surface px-4 py-3 text-left"
            >
              <MapPin size={16} className="text-primary-accent" /> Local físico
            </button>
            <button onClick={() => setStep("link")} className="flex items-center gap-2 rounded-xl bg-surface px-4 py-3 text-left">
              <Globe2 size={16} className="text-primary-accent" /> Compra online
            </button>
            <button onClick={() => setStep("done")} className="rounded-xl px-4 py-3 text-left text-neutral">
              Pular por enquanto
            </button>
          </div>
        )}

        {step === "place" && (
          <div className="flex flex-col gap-3">
            <label className="text-sm text-neutral">Nome do local</label>
            <input
              autoFocus
              value={placeName}
              onChange={(e) => {
                setPlaceName(e.target.value);
                setSelectedAddress(null);
                setShowManualAddress(false);
              }}
              placeholder="Ex: Restaurante Bella Massa"
              className="rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
            />

            {selectedAddress && (
              <div className="rounded-xl bg-surface px-4 py-3 flex justify-between items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-text min-w-0">
                  <MapPin size={14} className="text-primary-accent shrink-0" />
                  <span className="truncate">{selectedAddress.label}</span>
                </span>
                <button
                  onClick={() => setSelectedAddress(null)}
                  className="text-sm text-primary-accent shrink-0"
                >
                  Trocar
                </button>
              </div>
            )}
            {selectedAddress && (
              <PlaceMap latitude={selectedAddress.latitude} longitude={selectedAddress.longitude} />
            )}
            {!selectedAddress && addressSearch.data && addressSearch.data.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-neutral">É um destes endereços?</p>
                {addressSearch.data.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedAddress(s)}
                    className="text-left rounded-xl bg-surface px-4 py-3 hover:bg-surface/70 text-sm"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {!selectedAddress &&
              !addressSearch.isLoading &&
              addressSearch.data?.length === 0 &&
              debouncedPlaceName.trim().length > 2 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-neutral">Não encontramos esse endereço automaticamente.</p>
                  {!showManualAddress ? (
                    <button
                      onClick={() => setShowManualAddress(true)}
                      className="text-left text-sm text-primary-accent"                    >
                      Digitar endereço manualmente
                    </button>
                  ) : (
                    <input
                      autoFocus
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="Endereço (opcional)"
                      className="rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
                    />
                  )}
                </div>
              )}

            {placeDedup.data && placeDedup.data.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-neutral">Já existe cadastrado — é esse?</p>
                {placeDedup.data.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleLinkExistingPlace(c.id)}
                    className="text-left rounded-xl bg-surface px-4 py-3 hover:bg-surface/70"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <button
              disabled={placeName.trim().length < 1 || createPlace.isPending || linkPlace.isPending}
              onClick={handleCreateAndLinkPlace}
              className="rounded-xl bg-primary text-white py-3 font-medium disabled:opacity-40"
            >
              {createPlace.isPending || linkPlace.isPending ? "Salvando..." : "Criar novo local e vincular"}
            </button>
          </div>
        )}

        {step === "link" && (
          <div className="flex flex-col gap-3">
            <label className="text-sm text-neutral">Onde comprar</label>
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Ex: Amazon, Site oficial"
              className="rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
            />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
            />
            <button
              disabled={!linkUrl.trim() || addPurchaseLink.isPending}
              onClick={handleAddLink}
              className="rounded-xl bg-primary text-white py-3 font-medium disabled:opacity-40"
            >
              {addPurchaseLink.isPending ? "Salvando..." : "Salvar link"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-4 items-center py-6">
            <p className="text-2xl">✅</p>
            <p className="text-text text-center">
              <strong>{recommendationName}</strong> registrada.
            </p>
            <button onClick={onClose} className="rounded-xl bg-primary text-white py-3 px-8 font-medium">
              Fechar
            </button>
          </div>
        )}
      </div>
      {showImport && <ImportCodeModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
