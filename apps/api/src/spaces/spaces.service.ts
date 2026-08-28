import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.spaceMember.findMany({
      where: { userId },
      include: { space: true },
    });
  }

  async create(userId: string, name: string) {
    return this.prisma.space.create({
      data: {
        name,
        members: { create: { userId, role: "OWNER" } },
      },
    });
  }

  listMembers(spaceId: string) {
    return this.prisma.spaceMember.findMany({
      where: { spaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { role: "asc" }, // OWNER antes de MEMBER
    });
  }
}
