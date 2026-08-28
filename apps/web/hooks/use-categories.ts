"use client";

import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export function usePlaceCategories(q: string) {
  return useQuery({
    queryKey: ["place-categories", q],
    queryFn: () => apiClient.get<Category[]>(`/place-categories?q=${encodeURIComponent(q)}`),
    enabled: q.length > 0,
  });
}

export function useRecommendationCategories(q: string) {
  return useQuery({
    queryKey: ["recommendation-categories", q],
    queryFn: () => apiClient.get<Category[]>(`/recommendation-categories?q=${encodeURIComponent(q)}`),
  });
}