"use client";
import { useState } from "react";
import { PlaceMap } from "@/components/PlaceMap";

interface PlaceLocationSectionProps {
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function PlaceLocationSection({
  address,
  neighborhood,
  city,
  state,
  zipCode,
  latitude,
  longitude,
}: PlaceLocationSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const shortAddress = [address, neighborhood ?? city].filter(Boolean).join(" · ");
  const fullAddress = [address, neighborhood, city && state ? `${city}/${state}` : city, zipCode]
    .filter(Boolean)
    .join(" · ");

  const hasCoords = latitude != null && longitude != null;
  // destino: coords precisas quando existem, senão o texto do endereço — Google resolve sozinho.
  const destination = hasCoords ? `${latitude},${longitude}` : address;
  const directionsUrl = destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    : null;

  // Sem coords: nosso mapa não existe aqui, mas "Como chegar" continua disponível se houver endereço em texto.
  if (!hasCoords) {
    if (!fullAddress && !directionsUrl) return null;
    return (
      <div className="flex flex-col gap-2">
        {fullAddress && <p className="text-sm text-neutral">{fullAddress}</p>}
        {directionsUrl && (
          
          <a  href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm"
          >
            Como chegar
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="-mx-4 relative">
      <PlaceMap latitude={latitude!} longitude={longitude!} height={320} />

      {shortAddress && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="absolute top-3 left-3 z-10 max-w-[calc(100%-90px)] rounded-2xl bg-background/95 px-3 py-1.5 text-left text-sm text-text shadow-sm"
        >
          <span className={expanded ? "block whitespace-normal" : "block truncate"}>
            📍 {expanded ? fullAddress : shortAddress}
          </span>
        </button>
      )}

      
      <a  href={directionsUrl!}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 left-3 z-10 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-md"
      >
        Como chegar
      </a>
    </div>
  );
}