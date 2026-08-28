// Prisma 7: a connection string usada pelo CLI (migrate/studio/seed) sai do schema.prisma
// e vem pra cá. O PrismaClient em runtime (prisma.service.ts) usa um driver adapter à parte.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});