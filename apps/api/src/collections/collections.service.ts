import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { cursorArgs, toCursorPage } from "../common/pagination";
import { CreateCollectionInput } from "@ebg/shared-types";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}
  private async withCover(c: any) {
    const rawUrl = c.recommendations?.[0]?.recommendation?.photos?.[0]?.url ?? null;
    let coverUrl: string | null = null;
    if (rawUrl) {
      try {
        coverUrl = await this.storageService.getSignedReadUrl(rawUrl);
      } catch {
        coverUrl = null;
      }
    }
    const { recommendations, ...rest } = c;
    return { ...rest, coverUrl };
  }
  
  async list(spaceId: string, filters: { cursor?: string; limit?: string }) {
    const take = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);
    const rows = await this.prisma.collection.findMany({
      where: { spaceId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        recommendations: {
          take: 1,
          include: { recommendation: { include: { photos: { take: 1 } } } },
        },
      },
      ...cursorArgs(filters.cursor, take),
    });
    const page = toCursorPage(rows, take);
    return { ...page, items: await Promise.all(page.items.map((c) => this.withCover(c))) };
  }

  
  async findById(spaceId: string, id: string) {
    return this.prisma.collection.findFirstOrThrow({
      where: { id, spaceId },
      include: {
        recommendations: {
          include: { recommendation: { include: { photos: { take: 1 } } } },
        },
      },
    });
  }

  create(spaceId: string, dto: CreateCollectionInput) {
    return this.prisma.collection.create({ data: { spaceId, ...dto } });
  }

  async update(spaceId: string, id: string, dto: Partial<CreateCollectionInput>) {
    await this.prisma.collection.findFirstOrThrow({ where: { id, spaceId } });
    return this.prisma.collection.update({ where: { id }, data: dto });
  }

  async remove(spaceId: string, id: string) {
    await this.prisma.collection.findFirstOrThrow({ where: { id, spaceId } });
    // onDelete: Cascade NUNCA na Recommendation (INV-006) — só remove a Collection/pivot.
    return this.prisma.collection.delete({ where: { id } });
  }

  async addRecommendation(spaceId: string, collectionId: string, recommendationId: string) {
    await this.prisma.collection.findFirstOrThrow({ where: { id: collectionId, spaceId } });
    return this.prisma.collectionRecommendation.create({
      data: { collectionId, recommendationId },
    });
  }

  async removeRecommendation(spaceId: string, collectionId: string, recommendationId: string) {
    await this.prisma.collection.findFirstOrThrow({ where: { id: collectionId, spaceId } });
    return this.prisma.collectionRecommendation.delete({
      where: { collectionId_recommendationId: { collectionId, recommendationId } },
    });
  }
}
