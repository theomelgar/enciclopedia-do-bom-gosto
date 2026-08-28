import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { cursorArgs, toCursorPage } from "../common/pagination";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(spaceId: string, filters: { cursor?: string; limit?: string }) {
    const take = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);
    const rows = await this.prisma.brand.findMany({
      where: { spaceId },
      orderBy: [{ name: "asc" }, { id: "desc" }],
      ...cursorArgs(filters.cursor, take),
    });
    return toCursorPage(rows, take);
  }

  create(spaceId: string, name: string) {
    return this.prisma.brand.create({ data: { spaceId, name } });
  }

  findById(spaceId: string, id: string) {
    return this.prisma.brand.findFirstOrThrow({ where: { id, spaceId } });
  }
}
