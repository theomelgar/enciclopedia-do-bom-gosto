import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class SpacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,

  ) {}

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

  async listMembers(spaceId: string) {
    const members = await this.prisma.spaceMember.findMany({
      where: { spaceId },
      include: { user: true },
    });
  
    const paths = members.map((m) => m.user.avatarUrl).filter((p): p is string => !!p);
    const signed = await this.storageService.getSignedReadUrls(paths);
  
    return members.map((m) => ({
      id: m.id,
      role: m.role,
      user: {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl ? (signed[m.user.avatarUrl] ?? null) : null,
      },
    }));
  }
}
