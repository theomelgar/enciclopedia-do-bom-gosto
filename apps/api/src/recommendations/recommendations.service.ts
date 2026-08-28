import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { cursorArgs, toCursorPage } from "../common/pagination";
import {
  CreateRecommendationInput,
  SetVerdictInput,
  LinkPlaceInput,
  AddPriceEntryInput,
  AddPurchaseLinkInput,
} from "@ebg/shared-types";
import { SearchService } from "../search/search.service";
import { StorageService } from "../storage/storage.service";
import { signPaths } from "../common/sign-photos.util";

interface ListFilters {
  q?: string;
  status?: string;
  collectionId?: string;
  categoryId?: string;
  sort?: string;
  near?: string;
  radius?: string;
  cursor?: string;
  limit?: string;
}

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly storageService: StorageService,
  ) {}
  
  private generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I — evita confusão ao ditar
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async createShareCode(spaceId: string, recommendationId: string, userId: string) {
  await this.prisma.recommendation.findFirstOrThrow({ where: { id: recommendationId, spaceId } });
  const code = this.generateCode();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await this.prisma.recommendationShareCode.create({
    data: { code, recommendationId, createdById: userId, expiresAt },
  });
  return { code };
}

  private async withSignedPhotos<T extends { photos: { url: string }[] }>(rows: T[]): Promise<T[]> {
    const signed = await signPaths(this.storageService, rows.flatMap((r) => r.photos.map((p) => p.url)));
    return rows.map((r) => ({ ...r, photos: r.photos.map((p) => ({ ...p, url: signed[p.url] ?? p.url })) }));
  }

  private resolveOrderBy(sort?: string): Prisma.RecommendationOrderByWithRelationInput[] {
    switch (sort) {
      case "experiences_desc":
        return [{ experiences: { _count: "desc" } }, { id: "desc" }];
      case "experiences_asc":
        return [{ experiences: { _count: "asc" } }, { id: "desc" }];
      case "rating_desc":
        return [{ rating: { sort: "desc", nulls: "last" } }, { id: "desc" }];
      case "rating_asc":
        return [{ rating: { sort: "asc", nulls: "last" } }, { id: "desc" }];
      default:
        return [{ updatedAt: "desc" }, { id: "desc" }];
    }
  }

  async list(spaceId: string, filters: ListFilters) {
    const take = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);

    if (filters.q) {
      const ids = await this.searchService.searchIds(spaceId, filters.q);
      if (ids.length === 0) return { items: [], nextCursor: null };

      const rows = await this.prisma.recommendation.findMany({
        where: {
          id: { in: ids },
          spaceId,
          status: filters.status as any,
          ...(filters.collectionId && {
            collections: { some: { collectionId: filters.collectionId } },
          }),
          ...(filters.categoryId && { categoryId: filters.categoryId }),
        },
        include: { places: { include: { place: true } }, photos: true },
      });

      const rank = new Map(ids.map((id, i) => [id, i]));
      rows.sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
      return { items: await this.withSignedPhotos(rows.slice(0, take)), nextCursor: null };
    }

    const rows = await this.prisma.recommendation.findMany({
      where: {
        spaceId,
        status: filters.status as any,
        ...(filters.collectionId && {
          collections: { some: { collectionId: filters.collectionId } },
        }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
      },
      include: { places: { include: { place: true } }, photos: true },
      orderBy: this.resolveOrderBy(filters.sort),
      ...cursorArgs(filters.cursor, take),
    });
    const page = toCursorPage(rows, take);
    return { ...page, items: await this.withSignedPhotos(page.items) };
  }
  
  create(spaceId: string, userId: string, dto: CreateRecommendationInput) {
  const { keywords = [], categoryName, categoryId, brandId, ...data } = dto;
    return this.prisma.recommendation.create({
      data: {
        ...data,
        space: { connect: { id: spaceId } },
        createdBy: { connect: { id: userId } },
        updatedBy: { connect: { id: userId } },
        brand: brandId ? { connect: { id: brandId } } : undefined,
        category: categoryName
          ? { connectOrCreate: { where: { name: categoryName }, create: { name: categoryName } } }
          : categoryId
            ? { connect: { id: categoryId } }
            : undefined,
        keywords: keywords.length
          ? {
              create: keywords.map((label) => ({
                keyword: {
                  connectOrCreate: {
                    where: { spaceId_label: { spaceId, label } },
                    create: { spaceId, label },
                  },
                },
              })),
            }
          : undefined,
      },
    });
  }

  
  async findById(spaceId: string, id: string) {
    const rec = await this.prisma.recommendation.findFirstOrThrow({
      where: { id, spaceId },
      include: {
        places: { include: { place: true, priceHistory: true } },
        purchaseLinks: true,
        experiences: { include: { author: true, place: true }, orderBy: { visitedAt: "desc" } },
        photos: true,
        collections: { include: { collection: true } },
        brand: true,
        category: true,
      },
    });
    const [withPhotos] = await this.withSignedPhotos([rec]);
    return withPhotos;
  }

  async update(spaceId: string, id: string, dto: Partial<CreateRecommendationInput>) {
    await this.prisma.recommendation.findFirstOrThrow({ where: { id, spaceId } });
    const { keywords, categoryName, categoryId, ...data } = dto as any;
    return this.prisma.recommendation.update({
      where: { id },
      data: {
        ...data,
        category: categoryName
          ? { connectOrCreate: { where: { name: categoryName }, create: { name: categoryName } } }
          : categoryId
            ? { connect: { id: categoryId } }
            : categoryId === null
              ? { disconnect: true }
              : undefined,
      },
    });
  }

  async remove(spaceId: string, id: string) {
    await this.prisma.recommendation.findFirstOrThrow({ where: { id, spaceId } });
    return this.prisma.recommendation.delete({ where: { id } });
  }

  async setVerdict(spaceId: string, id: string, dto: SetVerdictInput) {
    await this.prisma.recommendation.findFirstOrThrow({ where: { id, spaceId } });
    return this.prisma.recommendation.update({
      where: { id },
      data: {
        verdict: dto.verdict,
        rating: dto.rating,
        status: "EXPERIENCED",
        firstExperiencedAt: new Date(),
        lastExperiencedAt: new Date(),
      },
    });
  }

  async linkPlace(spaceId: string, recommendationId: string, dto: LinkPlaceInput) {
    await this.prisma.recommendation.findFirstOrThrow({ where: { id: recommendationId, spaceId } });
    return this.prisma.recommendationPlace.create({ data: { recommendationId, ...dto } });
  }

  async unlinkPlace(spaceId: string, recommendationId: string, placeId: string) {
    await this.prisma.recommendationPlace.findFirstOrThrow({
      where: { recommendationId, placeId, recommendation: { spaceId } },
    });
    return this.prisma.recommendationPlace.delete({
      where: { recommendationId_placeId: { recommendationId, placeId } },
    });
  }

  async addPriceEntry(spaceId: string, recommendationId: string, placeId: string, dto: AddPriceEntryInput) {
    const link = await this.prisma.recommendationPlace.findFirstOrThrow({
      where: { recommendationId, placeId, recommendation: { spaceId } },
    });
    await this.prisma.recommendationPlace.update({
      where: { id: link.id },
      data: { lastPrice: dto.price },
    });
    return this.prisma.priceEntry.create({
      data: { recommendationPlaceId: link.id, price: dto.price, paidAt: dto.paidAt },
    });
  }

  async addPurchaseLink(spaceId: string, recommendationId: string, dto: AddPurchaseLinkInput) {
    await this.prisma.recommendation.findFirstOrThrow({ where: { id: recommendationId, spaceId } });
    return this.prisma.purchaseLink.create({ data: { recommendationId, ...dto } });
  }

  async removePurchaseLink(spaceId: string, linkId: string) {
    await this.prisma.purchaseLink.findFirstOrThrow({ where: { id: linkId, recommendation: { spaceId } } });
    return this.prisma.purchaseLink.delete({ where: { id: linkId } });
  }

  async addPhoto(spaceId: string, recommendationId: string, url: string, kind: string) {
    await this.prisma.recommendation.findFirstOrThrow({ where: { id: recommendationId, spaceId } });
    return this.prisma.photo.create({ data: { recommendationId, url, kind } });
  }

  // Regra de Ouro, nível 2 (DATABASE_SPEC.md): evita duas Recommendations "Pizza Portuguesa"
  // no mesmo Space+categoria; ao confirmar, o client só vincula novo Place/PurchaseLink.
  findDedupCandidates(spaceId: string, name: string, categoryId?: string) {
    return this.prisma.$queryRaw<Array<{ id: string; name: string; score: number }>>(
      Prisma.sql`
        SELECT id, name, similarity(name, ${name}) AS score
        FROM "recommendation"
        WHERE space_id = ${spaceId}
          ${categoryId ? Prisma.sql`AND category_id = ${categoryId}` : Prisma.empty}
          AND similarity(name, ${name}) > 0.4
        ORDER BY score DESC
        LIMIT 10;
      `,
    );
  }

  // 1 sugestão/dia, determinística — muda a cada 24h (seed = spaceId + data UTC).
  async dailySuggestions(spaceId: string) {
    const pool = await this.prisma.recommendation.findMany({
      where: { spaceId, status: "EXPERIENCED" },
      orderBy: { id: "asc" },
      select: {
                id: true,
                name: true,
                verdict: true,
                category: { select: { name: true, icon: true } },
                photos: { select: { url: true }, take: 1 } },
    });
    if (pool.length === 0) return [];

    const today = new Date().toISOString().slice(0, 10);
    const seed = createHash("sha256").update(`${spaceId}:${today}`).digest();
    const index = seed.readUInt32BE(0) % pool.length;

    const [picked] = await this.withSignedPhotos([pool[index]]);
    return [picked];
  }
}
