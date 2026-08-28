"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useNearbyPlacesQuery } from "@/hooks/use-nearby-places";
import { NearbyMap } from "@/components/NearbyMap";

const RADIUS_OPTIONS = [1000, 3000, 5000] as const;

export function NearbySheet({ onClose }: { onClose: () => void }) {
  const { coords } = useGeolocation();
  const [radius, setRadius] = useState<number>(3000);
  const nearby = useNearbyPlacesQuery(coords ?? null, radius);
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-lg bg-background rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-3 max-h-[90vh]">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-lg text-primary">Perto de mim</h2>
          <button aria-label="Fechar" onClick={onClose} className="text-neutral text-xl leading-none">×</button>
        </header>

        {!coords && (
          <p className="text-sm text-neutral">Ative sua localização pra ver o que está perto de você agora.</p>
        )}

        {coords && (
          <>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`rounded-full px-3 py-1 text-sm ${radius === r ? "bg-primary text-white" : "bg-surface text-text"}`}
                >
                  {r / 1000}km
                </button>
              ))}
            </div>

            {nearby.isLoading && <p className="text-sm text-neutral">Carregando...</p>}
            {nearby.data?.length === 0 && <p className="text-sm text-neutral">Nada num raio de {radius / 1000}km.</p>}
            {nearby.data && nearby.data.length > 0 && (
              <NearbyMap center={coords} places={nearby.data} onSelectPlace={(id) => router.push(`/locais/${id}`)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}