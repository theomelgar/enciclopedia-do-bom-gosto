import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // Escopo por spaceId via OR no dono (place OU recommendation) — Photo não carrega spaceId direto.
  async getSignedUrl(spaceId: string, photoId: string) {
    const photo = await this.prisma.photo.findFirstOrThrow({
      where: {
        id: photoId,
        OR: [{ place: { spaceId } }, { recommendation: { spaceId } }],
      },
    });
    return { signedUrl: await this.storageService.getSignedReadUrl(photo.url) };
  }
}