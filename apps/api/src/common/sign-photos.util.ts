import { StorageService } from "../storage/storage.service";

// Coleta paths únicos, assina em lote 1x, devolve mapa path->signedUrl.
export async function signPaths(
  storageService: StorageService,
  paths: string[],
): Promise<Record<string, string>> {
  return storageService.getSignedReadUrls(Array.from(new Set(paths)));
}