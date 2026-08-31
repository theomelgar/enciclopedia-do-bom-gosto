"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.truncateAll = truncateAll;
exports.seedSpace = seedSpace;
exports.seedUser = seedUser;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
exports.prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
// Truncate explícito (não reset de schema) — mais rápido, roda em todo beforeEach.
// Ordem respeita FKs (filhos antes dos pais). Nomes de tabela assumidos via @@map — confirmar contra schema.prisma real.
async function truncateAll() {
    await exports.prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "recommendation_keyword", "recommendation_place", "price_entry",
      "recommendation", "place", "recommendation_category", "place_category",
      "space_member", "space", "app_user"
    RESTART IDENTITY CASCADE;
  `);
}
function seedSpace(name = "Test Space") {
    return exports.prisma.space.create({ data: { name } });
}
function seedUser(email = "test@ebg.dev", name = "Test User") {
    return exports.prisma.user.create({ data: { email, name } });
}
