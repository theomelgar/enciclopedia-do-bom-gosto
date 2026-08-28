"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface MeResponse {
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  currentSpaceId: string;
  spaces: unknown[];
}

// GET /auth/me — dados reais do app_user (Prisma), não confundir com useSession() (Supabase Auth)
export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.get<MeResponse>("/auth/me"),
  });
}