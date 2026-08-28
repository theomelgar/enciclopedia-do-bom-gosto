import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Truncate explícito (não reset de schema) — mais rápido, roda em todo beforeEach.
// Ordem respeita FKs (filhos antes dos pais). Nomes de tabela assumidos via @@map — confirmar contra schema.prisma real.
export async function truncateAll() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "recommendation_keyword", "recommendation_place", "price_entry",
      "recommendation", "place", "recommendation_category", "place_category",
      "space_member", "space", "app_user"
    RESTART IDENTITY CASCADE;
  `);
}

export function seedSpace(name = "Test Space") {
  return prisma.space.create({ data: { name } });
}

export function seedUser(email = "test@ebg.dev", name = "Test User") {
  return prisma.user.create({ data: { email, name } });
}