"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useAddExperience(recommendationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { rating: number; comment?: string; placeId?: string }) =>
      apiClient.post(`/recommendations/${recommendationId}/experiences`, dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["recommendations", recommendationId] });
      if (variables.placeId) {
        qc.invalidateQueries({ queryKey: ["places", variables.placeId] });
      }
    },
  });
}

export function useUpdateExperience(recommendationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { expId: string; rating: number; comment?: string; placeId?: string | null }) =>
      apiClient.patch(`/recommendations/${recommendationId}/experiences/${dto.expId}`, {
        rating: dto.rating,
        comment: dto.comment,
        placeId: dto.placeId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}