"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface SpaceMemberItem {
  id: string;
  role: "OWNER" | "MEMBER";
  user: { id: string; name: string; email: string };
}

// GET /spaces/members — membros do Space ativo
export function useSpaceMembers() {
  return useQuery({
    queryKey: ["spaces", "members"],
    queryFn: () => apiClient.get<SpaceMemberItem[]>("/spaces/members"),
  });
}