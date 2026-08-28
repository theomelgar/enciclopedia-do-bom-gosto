"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface CreateCollectionInput {
  name: string;
  icon?: string;
}

// POST /collections
export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCollectionInput) => apiClient.post("/collections", dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });
}