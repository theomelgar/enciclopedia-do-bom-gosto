"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface RecommendationListItem {
  id: string;
  name: string;
  status: string;
  verdict: string | null;
  rating: string | null;
  photos: { id: string; url: string }[];
}

interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

interface RecommendationFilters {
  q?: string;
  status?: string;
  collectionId?: string;
  categoryId?: string;
  sort?: "recent" | "experiences_desc" | "experiences_asc" | "rating_desc" | "rating_asc";
  limit?: number;
}

// GET /recommendations — contrato em API_SPEC.md §Recommendations
export function useRecommendations(filters: RecommendationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.collectionId) params.set("collectionId", filters.collectionId);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.sort) params.set("sort", filters.sort);
  params.set("limit", String(filters.limit ?? 10));

  return useQuery({
    queryKey: ["recommendations", filters],
    queryFn: () => apiClient.get<CursorPage<RecommendationListItem>>(`/recommendations?${params}`),
  });
}
