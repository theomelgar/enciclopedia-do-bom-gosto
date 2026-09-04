"use client";
import { apiClient } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DAYS_OF_WEEK, type DayOfWeek, type OpeningHours, type UpdatePlaceInput } from "@ebg/shared-types";

export const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: "Segunda",
  tue: "Terça",
  wed: "Quarta",
  thu: "Quinta",
  fri: "Sexta",
  sat: "Sábado",
  sun: "Domingo",
};
export { DAYS_OF_WEEK };

export interface PlaceDetail {
  id: string;
  name: string;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: { name: string; icon: string | null } | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  website?: string | null;
  openingHours?: OpeningHours;  notes?: string | null;
  photos?: { url: string; kind: string }[];
  recommendations: {
    lastPrice: string | null;
    recommendation: {
      id: string;
      name: string;
      status: "WANT_TO_TRY" | "EXPERIENCED" | "DISCARDED";
      verdict: "RECOMMEND" | "EMERGENCY_ONLY" | "NOT_RECOMMEND" | null;
      photos: { url: string }[];
    };
  }[];
  experiences?: {
    id: string;
    rating: number;
    comment: string | null;
    visitedAt: string;
    author: { name: string; avatarUrl: string | null };
    recommendation: { id: string; name: string };
  }[];
}

// GET /places/:id — API_SPEC.md §Places
export function usePlace(id: string) {
  return useQuery({
    queryKey: ["places", id],
    queryFn: () => apiClient.get<PlaceDetail>(`/places/${id}`),
    enabled: !!id,
  });
}

// PATCH /places/:id — API_SPEC.md §Places
export function useUpdatePlace(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePlaceInput) => apiClient.patch<PlaceDetail>(`/places/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places", id] }); // plural — mesmo bug já visto em outros hooks
    },
  });
}