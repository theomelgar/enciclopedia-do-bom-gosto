"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useCreateShareCode(recommendationId: string) {
  return useMutation({
    mutationFn: () => apiClient.post<{ code: string }>(`/recommendations/${recommendationId}/share-code`, {}),
  });
}

export function useImportPreview(code: string) {
  return useQuery({
    queryKey: ["import", code],
    queryFn: () =>
      apiClient.get<{
        name: string;
        description: string | null;
        category: string | null;
        sourceLabel: string;
        places: { name: string; address: string | null }[];
        purchaseLinks: { label: string; url: string }[];
      }>(`/import/${code}`),
    enabled: code.length === 6,
    retry: false,
  });
}

export function useConfirmImport() {
  return useMutation({
    mutationFn: (code: string) => apiClient.post(`/import/${code}`, {}),
  });
}