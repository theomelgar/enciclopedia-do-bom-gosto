import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 removeu o motor de conexão interno: PrismaClient() sozinho não conecta mais,
// precisa de um driver adapter (ver https://pris.ly/d/prisma7-client-config).
// Toda query de tenant deve filtrar por spaceId explicitamente (INV-007).
// RLS no Postgres (DATABASE_SPEC.md) é defesa em profundidade, não substitui o filtro aqui.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }

  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
