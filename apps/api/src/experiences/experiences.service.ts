import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AddExperienceInput } from "@ebg/shared-types";

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  create(spaceId: string, recommendationId: string, authorId: string, dto: AddExperienceInput) {
    return this.prisma.$transaction(async (tx) => {
      await tx.recommendation.findFirstOrThrow({ where: { id: recommendationId, spaceId } });
      return tx.experience.create({ data: { recommendationId, authorId, ...dto } });
    });
  }

  listByRecommendation(spaceId: string, recommendationId: string) {
    return this.prisma.experience.findMany({
      where: { recommendationId, recommendation: { spaceId } },
      include: { author: true, place: true },
      orderBy: { visitedAt: "desc" },
    });
  }

  async update(spaceId: string, id: string, dto: { rating?: number; comment?: string; placeId?: string | null }) {
    await this.prisma.experience.findFirstOrThrow({ where: { id, recommendation: { spaceId } } });
    return this.prisma.experience.update({
      where: { id },
      data: {
        rating: dto.rating,
        comment: dto.comment,
        place: dto.placeId === null ? { disconnect: true } : dto.placeId ? { connect: { id: dto.placeId } } : undefined,
      },
    });
  }
}
