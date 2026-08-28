"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreateRecommendationInput, CreatePlaceInput } from "@ebg/shared-types";

export interface DedupCandidate {
  id: string;
  name: string;
  score: number;
}
export interface RecommendationSummary {
  id: string;
  name: string;
}
export interface PlaceSummary {
  id: string;
  name: string;
}

// Passo 1 do fluxo (proposta-v3.md §6): buscar Recommendation existente por nome
// antes de deixar criar uma nova — Regra de Ouro (dedup) aplicada já na digitação.
export function useRecommendationDedup(name: string) {
  return useQuery({
    queryKey: ["recommendations", "dedup", name],
    queryFn: () =>
      apiClient.get<DedupCandidate[]>(`/recommendations/dedup?name=${encodeURIComponent(name)}`),
    enabled: name.trim().length >= 2,
  });
}

// Sub-passo "Local físico": mesma Regra de Ouro, agora pro Place.
export function usePlaceDedup(name: string, lat?: number, lng?: number) {
    return useQuery({
    queryKey: ["places", "dedup", name, lat, lng],
    queryFn: () => {
      const params = new URLSearchParams({ name });
      if (lat != null) params.set("lat", String(lat));
      if (lng != null) params.set("lng", String(lng));
      return apiClient.get<DedupCandidate[]>(`/places/dedup?${params}`);
    },
     enabled: name.trim().length >= 2,
  });
 }

export function useCreateRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecommendationInput) =>
      apiClient.post<RecommendationSummary>("/recommendations", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations"] }),
  });
}

export function useCreatePlace() {
  return useMutation({
    mutationFn: (input: CreatePlaceInput) => apiClient.post<PlaceSummary>("/places", input),
  });
}

export function useLinkPlace(recommendationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { placeId: string; lastPrice?: number }) =>
      apiClient.post(`/recommendations/${recommendationId}/places`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations"] }),
  });
}

export function useUnlinkPlace(recommendationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (placeId: string) =>
      apiClient.delete(`/recommendations/${recommendationId}/places/${placeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}