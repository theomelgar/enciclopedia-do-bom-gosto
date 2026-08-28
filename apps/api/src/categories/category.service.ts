import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PlaceCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  list(q?: string) {
    return this.prisma.placeCategory.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
      take: 10,
    });
  }
}

@Injectable()
export class RecommendationCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  list(q?: string) {
    return this.prisma.recommendationCategory.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
      take: q ? 10 : undefined, // sem q = listagem completa p/ filtro de navegação (/busca); com q = autocomplete truncado
    });
  }
}