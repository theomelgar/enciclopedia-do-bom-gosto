"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { NearbyPlace } from "@/hooks/use-nearby-places";

// GET /places (sem ?near=) — API_SPEC.md §Places. Paginação cursor-based (convenções §Convenções).
export function usePlaces() {
  return useQuery({
    queryKey: ["places", "all"],
    queryFn: () => apiClient.get<{ items: NearbyPlace[] }>(`/places`),
    select: (data) => data.items,
  });
} 