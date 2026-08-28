"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface AddPurchaseLinkInput { label: string; url: string; kind: "MARKETPLACE" | "OFFICIAL_WEBSITE" | "OTHER" }

export function useAddPurchaseLink(recommendationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: AddPurchaseLinkInput) =>
      apiClient.post(`/recommendations/${recommendationId}/purchase-links`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}

export function useRemovePurchaseLink(recommendationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) =>
      apiClient.delete(`/recommendations/${recommendationId}/purchase-links/${linkId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}