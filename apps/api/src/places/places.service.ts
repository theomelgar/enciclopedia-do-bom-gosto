import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { cursorArgs, toCursorPage } from "../common/pagination";
import { CreatePlaceInput, UpdatePlaceInput } from "@ebg/shared-types";
import { StorageService } from "../storage/storage.service";
import { signPaths } from "../common/sign-photos.util";

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // Assina tanto place.photos (próprias) quanto recommendation.photos aninhado (nested via join).
  private async signPlaceRow<T extends {
    photos?: { url: string }[];
    recommendations?: { recommendation: { photos: { url: string }[] } }[];
  }>(row: T): Promise<T> {
    const paths = [
      ...(row.photos?.map((p) => p.url) ?? []),
      ...(row.recommendations?.flatMap((rp) => rp.recommendation.photos.map((p) => p.url)) ?? []),
    ];
    const signed = await signPaths(this.storageService, paths);
    return {
      ...row,
      photos: row.photos?.map((p) => ({ ...p, url: signed[p.url] ?? p.url })),
      recommendations: row.recommendations?.map((rp) => ({
        ...rp,
        recommendation: {
          ...rp.recommendation,
          photos: rp.recommendation.photos.map((p) => ({ ...p, url: signed[p.url] ?? p.url })),
        },
      })),
    };
  }

  async list(
    spaceId: string,
    filters: { near?: string; radius?: string; bbox?: string; cursor?: string; limit?: string },
  ) {
    const take = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);

    let nearIds: string[] | null = null;
    if (filters.near) {
      const [latStr, lngStr] = filters.near.split(",").map((s) => s.trim());
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new BadRequestException('near inválido — esperado "lat,lng"');
      }
      const radiusMeters = Math.min(Math.max(Number(filters.radius) || 3000, 1), 50000);

      const nearby = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "place"
        WHERE space_id = ${spaceId}
          AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
      `;
      nearIds = nearby.map((p) => p.id);
    } else if (filters.bbox) {
      const parts = filters.bbox.split(",").map((s) => Number(s.trim()));
      if (parts.length !== 4 || parts.some(Number.isNaN)) {
        throw new BadRequestException('bbox inválido — esperado "minLng,minLat,maxLng,maxLat"');
      }
      const [minLng, minLat, maxLng, maxLat] = parts;

      const within = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "place"
        WHERE space_id = ${spaceId}
          AND ST_Intersects(
            geom::geometry,
            ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
          )
      `;
      nearIds = within.map((p) => p.id);
    }

    const where = { spaceId, ...(nearIds ? { id: { in: nearIds } } : {}) };
    const orderBy = [{ updatedAt: "desc" as const }, { id: "desc" as const }];

    // recommendations só entra no payload em busca geo (near OU bbox — uso: mapa);
    // list geral continua leve, sem esse include. Duas queries literais (não ternário)
    // pra evitar union type no retorno do Prisma — TS2559 em signPlaceRow.
    if (filters.near || filters.bbox) {
      const rows = await this.prisma.place.findMany({
        where,
        orderBy,
        include: {
          recommendations: {
            include: { recommendation: { include: { photos: { take: 1 } } } },
          },
        },
        ...cursorArgs(filters.cursor, take),
      });
      const page = toCursorPage(rows, take);
      return { ...page, items: await Promise.all(page.items.map((r) => this.signPlaceRow(r))) };
    }

    const rows = await this.prisma.place.findMany({
      where,
      orderBy,
      ...cursorArgs(filters.cursor, take),
    });
    return toCursorPage(rows, take);
  }

  create(spaceId: string, userId: string, dto: CreatePlaceInput) {
  return this.prisma.$transaction(async (tx) => {
    const place = await tx.place.create({
      data: { spaceId, createdById: userId, updatedById: userId, ...dto },
    });
    if (dto.latitude != null && dto.longitude != null) {
      await tx.$executeRaw`
        UPDATE "place" SET geom = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography
        WHERE id = ${place.id}
      `;
    }
    return place;
  });
}

  async findById(spaceId: string, id: string) {
    const place = await this.prisma.place.findFirstOrThrow({
      where: { id, spaceId },
      include: {
        photos: true,
        recommendations: {
          include: {
            recommendation: { include: { photos: { take: 1 } } },
          },
        },
        experiences: {
          include: { author: true, recommendation: { select: { id: true, name: true } } },
          orderBy: { visitedAt: "desc" },
        },
      },
    });
    return this.signPlaceRow(place);
  }

  async update(spaceId: string, id: string, dto: UpdatePlaceInput) {
    await this.prisma.place.findFirstOrThrow({ where: { id, spaceId } });
    const { categoryName, categoryId, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      const place = await tx.place.update({
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
      if (dto.latitude != null && dto.longitude != null) {
        await tx.$executeRaw`
          UPDATE "place" SET geom = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography
          WHERE id = ${id}
        `;
        } else if (dto.latitude === null && dto.longitude === null) {
        // Endereço trocado pra manual (sem geocoding) — limpa geom, senão fica desalinhado com lat/lng.
        await tx.$executeRaw`UPDATE "place" SET geom = NULL WHERE id = ${id}`;
      }
      return place;
    });
  }

  // Regra de Ouro (DATABASE_SPEC.md §Queries de Dedup): similarity(name) > 0.4 OU
  // ST_DWithin(geom, ponto, 100m) OU telefone igual — candidatos antes de permitir criação.
  findDedupCandidates(
    spaceId: string,
    filters: { name: string; lat?: string; lng?: string; phone?: string },
  ) {
    const lat = filters.lat ? Number(filters.lat) : null;
    const lng = filters.lng ? Number(filters.lng) : null;
    const hasPoint = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);

    return this.prisma.$queryRaw<Array<{ id: string; name: string; score: number }>>(
      Prisma.sql`
        SELECT id, name, similarity(name, ${filters.name}) AS score
        FROM "place"
        WHERE space_id = ${spaceId}
          AND (
            similarity(name, ${filters.name}) > 0.4
            ${hasPoint
              ? Prisma.sql`OR ST_DWithin(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, 100)`
              : Prisma.empty}
            ${filters.phone ? Prisma.sql`OR phone = ${filters.phone}` : Prisma.empty}
          )
        ORDER BY score DESC
        LIMIT 10;
      `,
    );
  }
}