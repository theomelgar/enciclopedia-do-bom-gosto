"use client";
import { useParams, useRouter } from "next/navigation";
import { PlaceLocationSection } from "@/components/PlaceLocationSection";
import { useState } from "react";
import { DAY_LABEL, usePlace, useUpdatePlace } from "@/hooks/use-place";
import { DAYS_OF_WEEK, UpdatePlaceInput } from "@ebg/shared-types";
import { CategoryAutocomplete } from "@/components/CategoryAutocomplete";
import { usePlaceCategories } from "@/hooks/use-categories";
import { MapPin, Pencil, MessageCircle, Phone, Globe, Instagram as InstagramIcon } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { useAddressSearch, type AddressSuggestion } from "@/hooks/use-address-search";
import { useDebounce } from "@/hooks/use-debounce";
import { PlaceMap } from "@/components/PlaceMap";

const VERDICT_STYLE: Record<string, string> = {
  RECOMMEND: "bg-success/15 text-success",
  EMERGENCY_ONLY: "bg-primary/15 text-primary",
  NOT_RECOMMEND: "bg-destructive/15 text-destructive",
};
const VERDICT_LABEL: Record<string, string> = {
  NOT_RECOMMEND: "❌ Não recomendo",
  EMERGENCY_ONLY: "⚠️ Só emergência",
  RECOMMEND: "✅ Recomendo",
};

export default function PlacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: place, isLoading, error, refetch } = usePlace(id);
  const updatePlace = useUpdatePlace(id);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<UpdatePlaceInput>({});
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [tab, setTab] = useState<"info" | "exp">("info");

  // --- edição de endereço (reaproveita o mesmo fluxo do QuickAddSheet) ---
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const debouncedAddressQuery = useDebounce(addressQuery);
  const addressSearch = useAddressSearch(selectedAddress ? "" : debouncedAddressQuery);

 function openEdit() {
    setForm({
       categoryName: place?.category?.name ?? "",
       phone: place?.phone ?? "",
       whatsapp: place?.whatsapp ?? "",
       instagram: place?.instagram ?? "",
       website: place?.website ?? "",
       notes: place?.notes ?? "",
       openingHours: place?.openingHours ?? {},
     });
     setSameAsPhone(!place?.whatsapp || place?.whatsapp === place?.phone);
    setEditingAddress(false);
    setAddressQuery(place?.address ?? "");
    setSelectedAddress(null);
    setShowManualAddress(false);
    setManualAddress("");
    setShowEdit(true);
   }

  function handleSaveWithAddress() {
    const addressPatch = !editingAddress
      ? {}
      : selectedAddress
        ? { address: selectedAddress.label, latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
        : manualAddress.trim()
          // endereço manual = sem geocoding; zera coords explicitamente pra não deixar geom desalinhado
          ? { address: manualAddress.trim(), latitude: null, longitude: null }
          : {};
      updatePlace.mutate({ ...form, ...addressPatch }, {
      onSuccess: () => setShowEdit(false),
    });
  }

  function field<K extends "categoryName" | "phone" | "whatsapp" | "instagram" | "website" | "notes">(key: K) {
    return {
      value: (form[key] as string) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }
  
  const cover = place?.photos?.[0]?.url;

  return (
    <main className="min-h-screen flex flex-col">
        {/* Hero só existe quando há foto real — sem cover, tudo cabe numa linha compacta */}
      {cover && (
        <div className="relative h-40 bg-surface">
          <img src={cover} alt={place?.name ?? ""} className="h-full w-full object-cover" />
          <button
            aria-label="Voltar"
            onClick={() => router.back()}
            className="absolute top-3 left-3 h-9 w-9 rounded-full bg-background/90 flex items-center justify-center text-lg shadow-sm"
          >
            ←
          </button>
        </div>
      )}

      <div className="p-4 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          {!cover && (
            <button aria-label="Voltar" onClick={() => router.back()} className="text-2xl shrink-0">
              ←
            </button>
          )}
          <span className="h-10 w-10 rounded-lg bg-surface flex items-center justify-center text-xl shrink-0">
            {place?.category?.icon ?? "📍"}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl text-text truncate">{place?.name ?? "Local"}</h1>
            {place?.category?.name && <p className="text-neutral text-sm">{place.category.name}</p>}
          </div>
        </header>

        {isLoading && <p className="text-neutral text-sm">Carregando...</p>}
        {error && <ErrorState onRetry={() => refetch()} />}
        {place && (
          <PlaceLocationSection
            address={place.address}
            neighborhood={place.neighborhood}
            city={place.city}
            state={place.state}
            zipCode={place.zipCode}
            latitude={place.latitude}
            longitude={place.longitude}
          />
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-base text-text">O que encontram aqui</h2>

          {place && place.recommendations.length === 0 && (
            <p className="text-neutral text-sm">Nenhuma Recommendation vinculada ainda.</p>
          )}

          {place?.recommendations.map(({ recommendation: rec, lastPrice }) => (
            <button
              key={rec.id}
              onClick={() => router.push(`/recomendacoes/${rec.id}`)}
              className="flex items-center gap-3 p-2 rounded-xl bg-surface text-left active:scale-[0.98] transition"
            >
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-background flex items-center justify-center shrink-0">
                {rec.photos?.[0]?.url ? (
                  <img src={rec.photos[0].url} alt={rec.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl">🍽️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text text-sm font-medium truncate">{rec.name}</p>
                {rec.status === "WANT_TO_TRY" ? (
                  <span className="text-xs text-neutral">Quero experimentar</span>
                ) : rec.verdict ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${VERDICT_STYLE[rec.verdict]}`}>
                    {VERDICT_LABEL[rec.verdict]}
                  </span>
                ) : (
                  <span className="text-xs text-neutral">Sem veredito</span>
                )}
              </div>
              {lastPrice && <span className="text-sm text-neutral shrink-0">R$ {lastPrice}</span>}
            </button>
          ))}
        </section>

        <div className="flex border-b border-black/5 -mx-4 px-4">
          <button
            onClick={() => setTab("info")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "info" ? "border-primary-accent text-primary-accent" : "border-transparent text-neutral"
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setTab("exp")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "exp" ? "border-primary-accent text-primary-accent" : "border-transparent text-neutral"
            }`}
          >
            Experiências
          </button>
        </div>

        {tab === "info" && (
          <section className="flex flex-col gap-3">
            {place && !showEdit && (
              <button
                onClick={openEdit}
                className="self-start flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-primary-accent text-sm font-medium"
              >
                <Pencil size={14} /> Editar informações
              </button>
             )}

            {!showEdit && (
              <>
                {(place?.phone || place?.whatsapp) && (
                   <div className="flex gap-2 flex-wrap">
                     {place!.whatsapp && (
                      <a href={`https://wa.me/${place!.whatsapp}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface text-sm">
                        <MessageCircle size={15} /> WhatsApp
                       </a>
                     )}
                     {place!.phone && place!.phone !== place!.whatsapp && (
                      <a href={`tel:${place!.phone}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface text-sm">
                        <Phone size={15} /> Ligar
                       </a>
                     )}
                     {place!.website && (
                      <a href={place!.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface text-sm">
                        <Globe size={15} /> Site
                       </a>
                     )}
                     {place!.instagram && (
                      <a href={`https://instagram.com/${place!.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface text-sm">
                        <InstagramIcon size={15} /> Instagram
                       </a>
                     )}
                   </div>
                 )}
                {place?.openingHours && Object.keys(place.openingHours).length > 0 && (
                  <ul className="text-sm text-text flex flex-col gap-0.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const h = place.openingHours?.[day];
                      if (h === undefined) return null;
                      return (
                        <li key={day} className="flex justify-between">
                          <span className="text-neutral">{DAY_LABEL[day]}</span>
                          <span>{h ? `${h.open} – ${h.close}` : "Fechado"}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {place?.notes && <p className="text-text text-sm whitespace-pre-wrap">{place.notes}</p>}
                {!place?.phone && !place?.whatsapp && !place?.website && !place?.instagram && !place?.notes && !place?.openingHours && (
                  <p className="text-neutral text-sm">Nenhuma informação cadastrada ainda.</p>
                )}
              </>
            )}

            {showEdit && (
               <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
                {/* Endereço — read-only até o usuário pedir explicitamente pra trocar (evita re-geocodificar sem querer) */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-neutral">Endereço</span>
                  {!editingAddress ? (
                    <button
                      type="button"
                      onClick={() => setEditingAddress(true)}
                      className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-sm text-left"
                    >
                      <MapPin size={14} className="text-primary-accent shrink-0" />
                      <span className="flex-1 truncate text-text">{place?.address ?? "Não informado"}</span>
                      <span className="text-primary-accent shrink-0">alterar</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        autoFocus
                        value={addressQuery}
                        onChange={(e) => { setAddressQuery(e.target.value); setSelectedAddress(null); setShowManualAddress(false);}}
                        placeholder="Buscar novo endereço..."
                        className="rounded-xl bg-background px-3 py-2 text-sm"
                      />
                      {selectedAddress && (
                        <>
                          <div className="rounded-xl bg-background px-3 py-2 flex justify-between items-center gap-2">
                            <span className="flex items-center gap-1.5 text-sm text-text min-w-0">
                              <MapPin size={14} className="text-primary-accent shrink-0" />
                              <span className="truncate">{selectedAddress.label}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedAddress(null)}
                              className="text-sm text-primary-accent shrink-0"
                            >
                              Trocar
                            </button>
                          </div>
                          <PlaceMap latitude={selectedAddress.latitude} longitude={selectedAddress.longitude} height={160} />
                        </>
                      )}
                      {!selectedAddress && addressSearch.data && addressSearch.data.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          {addressSearch.data.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedAddress(s)}
                              className="text-left rounded-xl bg-background px-3 py-2 text-sm hover:bg-background/70"
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {!selectedAddress &&
                        !addressSearch.isLoading &&
                        addressSearch.data?.length === 0 &&
                        debouncedAddressQuery.trim().length > 2 && (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-neutral">Não encontramos esse endereço automaticamente.</p>
                            {!showManualAddress ? (
                              <button
                                type="button"
                                onClick={() => setShowManualAddress(true)}
                                className="text-left text-sm text-primary-accent"
                              >
                                Digitar endereço manualmente
                              </button>
                            ) : (
                              <input
                                autoFocus
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                                placeholder="Endereço (sem mapa — geocodificação manual)"
                                className="rounded-xl bg-background px-3 py-2 text-sm"
                              />
                            )}
                          </div>
                        )}
                      <button
                        type="button"
                          onClick={() => {
                          setEditingAddress(false);
                          setSelectedAddress(null);
                          setShowManualAddress(false);
                          setManualAddress("");
                          setAddressQuery(place?.address ?? "");
                        }}                        className="self-start text-sm text-neutral"
                      >
                        cancelar troca de endereço
                      </button>
                    </div>
                  )}
                </div>

                <CategoryAutocomplete
                  value={form.categoryName ?? ""}
                  onChange={(name) => setForm((f) => ({ ...f, categoryName: name }))}
                  useSearch={usePlaceCategories}
                />                <input
                  placeholder="Telefone / WhatsApp"
                  value={form.phone ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, phone: v, ...(sameAsPhone ? { whatsapp: v } : {}) }));
                  }}
                  className="rounded-xl bg-background px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-neutral">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => {
                      setSameAsPhone(e.target.checked);
                      if (e.target.checked) setForm((f) => ({ ...f, whatsapp: f.phone }));
                    }}
                  />
                  WhatsApp é o mesmo número
                </label>
                {!sameAsPhone && (
                  <input placeholder="WhatsApp" {...field("whatsapp")} className="rounded-xl bg-background px-3 py-2 text-sm" />
                )}
                <input placeholder="Instagram (usuário, sem @)" {...field("instagram")} className="rounded-xl bg-background px-3 py-2 text-sm" />
                <input placeholder="Site" {...field("website")} className="rounded-xl bg-background px-3 py-2 text-sm" />
                <textarea placeholder="Notas" {...field("notes")} className="rounded-xl bg-background px-3 py-2 text-sm" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-neutral">Horário de funcionamento</span>
                  {DAYS_OF_WEEK.map((day) => {
                    const h = form.openingHours?.[day];
                    const closed = h === null || h === undefined;
                    return (
                      <div key={day} className="flex items-center gap-2 text-sm">
                        <span className="w-16 shrink-0 text-text">{DAY_LABEL[day]}</span>
                        <label className="flex items-center gap-1 text-neutral">
                          <input
                            type="checkbox"
                            checked={!closed}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                openingHours: {
                                  ...f.openingHours,
                                  [day]: e.target.checked ? { open: "09:00", close: "18:00" } : null,
                                },
                              }))
                            }
                          />
                          aberto
                        </label>
                        {!closed && (
                          <>
                            <input
                              type="time"
                              value={h?.open ?? "09:00"}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  openingHours: { ...f.openingHours, [day]: { open: e.target.value, close: h?.close ?? "18:00" } },
                                }))
                              }
                              className="rounded-lg bg-background px-2 py-1"
                            />
                            <span className="text-neutral">–</span>
                            <input
                              type="time"
                              value={h?.close ?? "18:00"}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  openingHours: { ...f.openingHours, [day]: { open: h?.open ?? "09:00", close: e.target.value } },
                                }))
                              }
                              className="rounded-lg bg-background px-2 py-1"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    disabled={updatePlace.isPending}
                    onClick={handleSaveWithAddress}
                    className="flex-1 rounded-xl bg-primary text-white py-2 text-sm disabled:opacity-60"
                  >
                    {updatePlace.isPending ? "Salvando..." : "Salvar"}
                  </button>
                  <button onClick={() => setShowEdit(false)} className="text-neutral text-sm px-3">
                    cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "exp" && (
          <section className="flex flex-col gap-2">
            {place && place.experiences?.length === 0 && <p className="text-neutral text-sm">Nenhuma experiência ainda.</p>}
            {place?.experiences?.map((exp) => (
              <button
                key={exp.id}
                onClick={() => router.push(`/recomendacoes/${exp.recommendation.id}`)}
                className="rounded-xl bg-surface px-4 py-3 text-left"
              >
                <p className="text-sm text-neutral">
                  {exp.author.name} · ★{exp.rating} · sobre <span className="text-primary-accent">{exp.recommendation.name}</span>
                </p>
                {exp.comment && <p className="text-text">{exp.comment}</p>}
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}