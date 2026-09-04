"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase-client";

interface SignUploadResponse { uploadUrl: string; path: string; token: string }

export function useUploadPhoto(recommendationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const signed = await apiClient.post<SignUploadResponse>("/storage/sign-upload", {
        fileName: file.name,
        contentType: file.type,
      });
      const { error } = await supabase.storage
        .from("recommendation-photos")
        .uploadToSignedUrl(signed.path, signed.token, file);
      if (error) throw error;
      return apiClient.post(`/recommendations/${recommendationId}/photos`, {
        url: signed.path,
        kind: "recommendation",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}

export function useDeletePhoto(recommendationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) =>
      apiClient.delete(`/recommendations/${recommendationId}/photos/${photoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}