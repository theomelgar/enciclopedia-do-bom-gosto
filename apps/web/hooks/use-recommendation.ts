"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { SetVerdictInput } from "@ebg/shared-types";

export interface RecommendationDetail {
  id: string;
  name: string;
  description: string | null;
  status: "WANT_TO_TRY" | "EXPERIENCED" | "DISCARDED";
  verdict: "RECOMMEND" | "EMERGENCY_ONLY" | "NOT_RECOMMEND" | null;
  rating: string | null;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  places: Array<{
    id: string;
    lastPrice: string | null;
    notes: string | null;
    place: { id: string; name: string; address: string | null; latitude: number | null; longitude: number | null };  }>;
  purchaseLinks: Array<{ id: string; label: string; url: string; kind: string }>;
  experiences: Array<{
    id: string;
    rating: number;
    comment: string | null;
    visitedAt: string;
    author: { id: string; name: string; avatarUrl: string | null };
    place: { id: string; name: string } | null;
  }>;
  photos: Array<{ id: string; url: string; kind: string }>;
  collections: Array<{
    collection: { id: string; name: string; icon: string | null };
  }>;
}

// GET /recommendations/:id — contrato em API_SPEC.md §Recommendations
export function useRecommendation(id: string) {
  return useQuery({
    queryKey: ["recommendations", id],
    queryFn: () => apiClient.get<RecommendationDetail>(`/recommendations/${id}`),
    enabled: !!id,
  });
}

export function useSetVerdict(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetVerdictInput) =>
      apiClient.post(`/recommendations/${id}/verdict`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recommendations", id] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

// PATCH /recommendations/:id — edição de campos livres (categoria, descrição)
export function useUpdateRecommendation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { categoryName?: string; categoryId?: string | null; description?: string }) =>
      apiClient.patch(`/recommendations/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations", id] }),
  });
}

export function useDeleteRecommendation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete(`/recommendations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
  });
}