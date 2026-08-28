"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface SuggestionItem {
  id: string;
  name: string;
  verdict: string | null;
  category: { name: string; icon: string | null } | null;
  photos: { url: string }[];
}

// GET /recommendations/suggestions — sugestões diárias determinísticas (INV-010, sem IA)
export function useSuggestions() {
  return useQuery({
    queryKey: ["recommendations", "suggestions"],
    queryFn: () => apiClient.get<SuggestionItem[]>("/recommendations/suggestions"),
  });
}