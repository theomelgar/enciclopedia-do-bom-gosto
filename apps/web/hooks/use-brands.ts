"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Brand { id: string; name: string; logoUrl: string | null; website: string | null }
interface CursorPage<T> { items: T[]; nextCursor: string | null }

export function useBrands() {
  return useQuery({ queryKey: ["brands"], queryFn: () => apiClient.get<CursorPage<Brand>>("/brands") });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiClient.post<Brand>("/brands", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

// PATCH /recommendations/:id — vincula brandId existente
export function useSetRecommendationBrand(recommendationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (brandId: string | null) =>
      apiClient.patch(`/recommendations/${recommendationId}`, { brandId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}