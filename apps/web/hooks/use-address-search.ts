"use client";
import { useQuery } from "@tanstack/react-query";

export interface AddressSuggestion {
  id: string;
  label: string; // endereço formatado — único dado exibido ao usuário
  latitude: number;
  longitude: number;
}

async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "5" });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
   headers: { Accept: "application/json", "User-Agent": "enciclopedia-do-bom-gosto/1.0" },
  });
  if (!res.ok) throw new Error("Falha ao buscar endereço");
  const data = await res.json();
  return data.map((r: any) => ({
    id: String(r.place_id),
    label: r.display_name as string,
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
  }));
}

// Busca endereço por nome do local (Nominatim/OSM) — arquitetura já prevista em V3 §3.
export function useAddressSearch(query: string) {
  return useQuery({
    queryKey: ["address-search", query],
    queryFn: () => searchAddress(query),
    enabled: query.trim().length > 2,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}