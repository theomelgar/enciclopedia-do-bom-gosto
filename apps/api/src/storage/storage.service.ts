import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { SupabaseService } from "../supabase/supabase.service";

const BUCKET = "recommendation-photos";

@Injectable()
export class StorageService {
  constructor(private readonly supabase: SupabaseService) {}

  async signUpload(spaceId: string, fileName: string, contentType: string) {
    const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
    const path = `${spaceId}/${randomUUID()}${ext ? `.${ext}` : ""}`;

    const { data, error } = await this.supabase.client.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error) throw error;

    // Bucket privado (DATABASE_SPEC.md v3 §Storage) — getPublicUrl não resolve mais nada,
    // removido. Client agora persiste `path`, não URL; leitura sempre via signed URL.
    return {
      uploadUrl: data.signedUrl,
      path,
      token: data.token,
    };
  }

  async uploadBuffer(path: string, buffer: Buffer, contentType: string) {
    const { error } = await this.supabase.client.storage
      .from("recommendation-photos")
      .upload(path, buffer, { contentType });
    if (error) throw error;
  }

  async deleteObject(path: string) {
    await this.supabase.client.storage.from("recommendation-photos").remove([path]);
  }

  async getSignedReadUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await this.supabase.client.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  }

 // Batch — evita N+1 (1 call por foto) em telas de lista.
  async getSignedReadUrls(paths: string[], expiresIn = 3600): Promise<Record<string, string>> {
    if (paths.length === 0) return {};
    const { data, error } = await this.supabase.client.storage
      .from(BUCKET)
      .createSignedUrls(paths, expiresIn);
    if (error) throw error;
    // Item individual pode falhar (path inexistente) e vir com signedUrl null — descartado do map;
    // callers já fazem fallback `signed[url] ?? url` quando a chave não existe.
    return Object.fromEntries(
      data
        .map((d, i) => [paths[i], d.signedUrl] as const)
        .filter((entry): entry is [string, string] => entry[1] != null),
    );
  }
}