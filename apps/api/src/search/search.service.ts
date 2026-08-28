import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SearchQueryInput } from "@ebg/shared-types";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  // Busca por intenção (INV-002): rankeia por search_vector (tsvector, populado via trigger —
  // DATABASE_SPEC.md §Triggers) e cai pra fuzzy (pg_trgm) se a query for muito curta/sem resultado
  // em tsvector, cobrindo erro de digitação.
 async search(spaceId: string, dto: SearchQueryInput) {
    const ids = await this.searchIds(spaceId, dto.q);
    return this.hydrate(ids);
  }

  async searchIds(spaceId: string, q: string, limit = 100): Promise<string[]> {
    const [byRecIntent, byRecFuzzy, byPlace] = await Promise.all([
      this.prisma.$queryRaw<Array<{ id: string; rank: number }>>(
        Prisma.sql`
          SELECT id, ts_rank(search_vector, websearch_to_tsquery('portuguese', ${q})) AS rank
          FROM "recommendation"
          WHERE space_id = ${spaceId}
            AND search_vector @@ websearch_to_tsquery('portuguese', ${q})
          ORDER BY rank DESC
          LIMIT ${limit};
        `,
      ),
      this.prisma.$queryRaw<Array<{ id: string; score: number }>>(
        Prisma.sql`
          SELECT id, similarity(name, ${q}) AS score
          FROM "recommendation"
          WHERE space_id = ${spaceId} AND similarity(name, ${q}) > 0.2
          ORDER BY score DESC
          LIMIT ${limit};
        `,
      ),
      this.prisma.$queryRaw<Array<{ recommendation_id: string; score: number }>>(
        Prisma.sql`
          SELECT rp.recommendation_id, MAX(similarity(p.name, ${q})) AS score
          FROM "place" p
          JOIN "recommendation_place" rp ON rp.place_id = p.id
          WHERE p.space_id = ${spaceId} AND similarity(p.name, ${q}) > 0.2
          GROUP BY rp.recommendation_id
          ORDER BY score DESC
          LIMIT ${limit};
        `,
      ),
    ]);

    if (byRecIntent.length > 0) return byRecIntent.map((r) => r.id);

    const merged: string[] = [];
    const seen = new Set<string>();
    for (const r of byRecFuzzy) {
      if (!seen.has(r.id)) { seen.add(r.id); merged.push(r.id); }
    }
    for (const r of byPlace) {
      if (!seen.has(r.recommendation_id)) { seen.add(r.recommendation_id); merged.push(r.recommendation_id); }
    }
    return merged.slice(0, limit);
  }
  
  private hydrate(ids: string[]) {
    if (ids.length === 0) return [];
    return this.prisma.recommendation.findMany({
      where: { id: { in: ids } },
      include: { places: { include: { place: true } } },
    });
  }

  autocompleteKeywords(spaceId: string, prefix: string) {
    return this.prisma.searchKeyword.findMany({
      where: { spaceId, label: { startsWith: prefix, mode: "insensitive" } },
      take: 10,
    });
  }
}
