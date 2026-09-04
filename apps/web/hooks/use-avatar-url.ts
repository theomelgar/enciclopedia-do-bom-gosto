"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useAvatarUrl(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "me", "avatar-url"],
    queryFn: () => apiClient.get<{ url: string | null }>("/auth/me/avatar-url"),
    enabled,
  });
}