"use client";

import { apiClient } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CollectionItem {
  id: string;
  name: string;
  icon: string | null;
  coverUrl?: string | null;
}

interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

interface CollectionDetail extends CollectionItem {
  recommendations: {
    recommendation: {
      id: string;
      name: string;
      verdict: string | null;
      status: string;
      photos: { url: string }[];
    };
  }[];
}

// GET /collections/:id
export function useCollection(id: string) {
  return useQuery({
    queryKey: ["collections", id],
    queryFn: () => apiClient.get<CollectionDetail>(`/collections/${id}`),
    enabled: !!id,
  });
}

// PATCH /collections/:id
export function useUpdateCollection(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiClient.patch(`/collections/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", id] });
    },
  });
}

// DELETE /collections/:id
export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/collections/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });
}

// GET /collections — contrato em API_SPEC.md §Collections
export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => apiClient.get<CursorPage<CollectionItem>>("/collections"),
  });
}

// POST /collections/:id/recommendations/:recId
export function useAddToCollection(recommendationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) =>
      apiClient.post(`/collections/${collectionId}/recommendations/${recommendationId}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}

// DELETE /collections/:id/recommendations/:recId
export function useRemoveFromCollection(recommendationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) =>
      apiClient.delete(`/collections/${collectionId}/recommendations/${recommendationId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations", recommendationId] }),
  });
}

// POST /collections/:id/recommendations/:recId — fluxo iniciado pela tela da Coleção
export function useAddRecommendationToCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recommendationId: string) =>
      apiClient.post(`/collections/${collectionId}/recommendations/${recommendationId}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections", collectionId] }),
  });
}