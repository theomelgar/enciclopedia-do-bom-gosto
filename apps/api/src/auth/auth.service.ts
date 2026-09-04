import { Injectable } from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class AuthService {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_ANON_KEY ?? "",
  );

  constructor(
      private readonly prisma: PrismaService
      ,private readonly storageService: StorageService,
  ) {}

  async sendMagicLink(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return { sent: true };
  }

  async exchangeToken(accessToken: string) {
    const { data, error } = await this.supabase.auth.getUser(accessToken);
    if (error) throw error;
    return { email: data.user?.email };
  }

  async getCurrentUser(user: { id: string; name: string; email: string }, spaceId: string) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
     const spaces = await this.prisma.spaceMember.findMany({
       where: { userId: user.id },
       include: { space: true },
     });
    return { user: dbUser, currentSpaceId: spaceId, spaces };
   }

  updateProfile(userId: string, dto: { avatarUrl?: string | null; name?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data: dto });
  }

 async getAvatarSignedUrl(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.avatarUrl) return { url: null };
    const url = await this.storageService.getSignedReadUrl(user.avatarUrl);
    return { url };
  }
}
