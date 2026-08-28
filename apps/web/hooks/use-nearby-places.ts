"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface NearbyRecommendationSummary {
  id: string;
  name: string;
  verdict: "RECOMMEND" | "EMERGENCY_ONLY" | "NOT_RECOMMEND" | null;
  lastPrice: number | null;
}

export interface NearbyPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  recommendations: NearbyRecommendationSummary[];
}

type NearbyPlacesResponse =
  | NearbyPlace[]
  | { data: NearbyPlace[]; cursor?: string | null; total?: number };

// GET /places?near= — API_SPEC.md §Places
// Assume que o backend inclui `recommendations` (via RecommendationPlace) no payload.
export function useNearbyPlaces(lat?: number, lng?: number, radius = 3000) {
  return useQuery({
    queryKey: ["places", "near", lat, lng, radius],
    queryFn: () =>
      apiClient.get<NearbyPlacesResponse>(`/places?near=${lat},${lng}&radius=${radius}`),
    enabled: lat != null && lng != null,
    select: (res): NearbyPlace[] => (Array.isArray(res) ? res : (res?.data ?? [])),
  });
}

// GET /places?near=lat,lng&radius= — API_SPEC.md §Places (já suporta filtro geo real)
export function useNearbyPlacesQuery(coords: { lat: number; lng: number } | null, radius: number) {
  return useQuery({
    queryKey: ["places", "near", coords, radius],
    queryFn: () =>
      apiClient.get<{ items: NearbyPlace[] }>(`/places?near=${coords!.lat},${coords!.lng}&radius=${radius}`),
    select: (data) => data.items,
    enabled: coords != null,
  });
}