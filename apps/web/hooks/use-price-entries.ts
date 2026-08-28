"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// POST /recommendations/:id/places/:placeId/price-entries — ADR-001: preço é por par Recommendation+Place
export function useAddPriceEntry(recommendationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, price }: { placeId: string; price: number }) =>
      apiClient.post(`/recommendations/${recommendationId}/places/${placeId}/price-entries`, { price }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}