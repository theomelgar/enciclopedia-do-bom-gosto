"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface PlaceRecommendation {
  id: string;
  name: string;
  status: "WANT_TO_TRY" | "EXPERIENCED" | "DISCARDED";
  verdict: "RECOMMEND" | "EMERGENCY_ONLY" | "NOT_RECOMMEND" | null;
  lastPrice: string | null; // RecommendationPlace.lastPrice — assumido no payload; confirmar contrato real do endpoint
  photos: { url: string }[];
}

// GET /places/:id/recommendations — API_SPEC.md v2 / ADR-001 v3
export function usePlaceRecommendations(placeId: string) {
  return useQuery({
    queryKey: ["places", placeId, "recommendations"],
    queryFn: async () => {
      const page = await apiClient.get<{ items: PlaceRecommendation[]; nextCursor: string | null }>(
        `/places/${placeId}/recommendations`,
      );
      return page.items; // CursorPage — não assumir array puro (bug recorrente, STATE.md v4)
    },
    enabled: !!placeId,
  });
}