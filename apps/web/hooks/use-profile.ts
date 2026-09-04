"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase-client";

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const { path, token } = await apiClient.post<{
        uploadUrl: string; path: string; token: string;
      }>("/storage/sign-upload", { fileName: `avatar.${ext}`, contentType: file.type });
      await supabase.storage.from("recommendation-photos").uploadToSignedUrl(path, token, file);
      await apiClient.patch("/auth/me", { avatarUrl: path });
      return path;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me", "avatar-url"] });
    },
  });
}