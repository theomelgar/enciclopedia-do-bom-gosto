import { PlacesService } from "./places/places.service";
import { RecommendationsService } from "./recommendations/recommendations.service";
import { prisma, truncateAll, seedSpace, seedUser } from "../test/db-helpers";

// STATE.md §Estratégia de Testes, prioridade 1. Dedup roda direto no Postgres
// (similarity()/ST_DWithin) — searchService/storageService não entram nesse método, stub basta.
describe("Dedup — Regra de Ouro (DATABASE_SPEC.md)", () => {
  const placesService = new PlacesService(prisma as any, {} as any);
  const recommendationsService = new RecommendationsService(prisma as any, {} as any, {} as any);

  let spaceId: string;
  let otherSpaceId: string;
  let userId: string;

  beforeEach(async () => {
    await truncateAll();
    spaceId = (await seedSpace()).id;
    otherSpaceId = (await seedSpace("Other Space")).id;
    userId = (await seedUser()).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Place", () => {
    it("nome similar (>0.4) é candidato", async () => {
      await prisma.place.create({
        data: { spaceId, name: "Bella Massa", createdById: userId, updatedById: userId },
      });
      const candidates = await placesService.findDedupCandidates(spaceId, { name: "Bela Massa" });
      expect(candidates.map((c) => c.name)).toContain("Bella Massa");
    });

    it("nome diferente não é candidato", async () => {
      await prisma.place.create({
        data: { spaceId, name: "Bella Massa", createdById: userId, updatedById: userId },
      });
      const candidates = await placesService.findDedupCandidates(spaceId, { name: "Forneria Toscana" });
      expect(candidates).toHaveLength(0);
    });

    it("geo <100m é candidato mesmo com nome diferente", async () => {
      const place = await prisma.place.create({
        data: { spaceId, name: "Bella Massa", createdById: userId, updatedById: userId },
      });
      await prisma.$executeRawUnsafe(
        `UPDATE "place" SET geom = ST_SetSRID(ST_MakePoint(-43.19, -22.97), 4326)::geography WHERE id = $1`,
        place.id,
      );
      const candidates = await placesService.findDedupCandidates(spaceId, {
        name: "Restaurante Qualquer",
        lat: "-22.9701",
        lng: "-43.1901",
      });
      expect(candidates.map((c) => c.id)).toContain(place.id);
    });

    it("telefone igual é candidato mesmo com nome diferente", async () => {
      await prisma.place.create({
        data: { spaceId, name: "Bella Massa", phone: "21999990000", createdById: userId, updatedById: userId },
      });
      const candidates = await placesService.findDedupCandidates(spaceId, {
        name: "Nome Totalmente Diferente",
        phone: "21999990000",
      });
      expect(candidates.map((c) => c.name)).toContain("Bella Massa");
    });

    it("fora do raio + nome diferente não é candidato", async () => {
      const place = await prisma.place.create({
        data: { spaceId, name: "Bella Massa", createdById: userId, updatedById: userId },
      });
      await prisma.$executeRawUnsafe(
        `UPDATE "place" SET geom = ST_SetSRID(ST_MakePoint(-43.19, -22.97), 4326)::geography WHERE id = $1`,
        place.id,
      );
      const candidates = await placesService.findDedupCandidates(spaceId, {
        name: "Forneria Toscana",
        lat: "-23.50",
        lng: "-46.63",
      });
      expect(candidates).toHaveLength(0);
    });

    it("isolamento por spaceId — mesmo nome em outro Space não aparece", async () => {
      await prisma.place.create({
        data: { spaceId: otherSpaceId, name: "Bella Massa", createdById: userId, updatedById: userId },
      });
      const candidates = await placesService.findDedupCandidates(spaceId, { name: "Bella Massa" });
      expect(candidates).toHaveLength(0);
    });
  });

  describe("Recommendation (nível 2)", () => {
    it("nome similar + mesma categoria é candidato", async () => {
      const category = await prisma.recommendationCategory.create({ data: { name: "Pizza" } });
      const rec = await prisma.recommendation.create({
        data: { spaceId, name: "Pizza Portuguesa", categoryId: category.id, createdById: userId, updatedById: userId },
      });
      const candidates = await recommendationsService.findDedupCandidates(spaceId, "Pizza Portugueza", category.id);
      expect(candidates.map((c) => c.id)).toContain(rec.id);
    });

    it("mesmo nome, categoria diferente não é candidato (escopo nível 2)", async () => {
      const categoryA = await prisma.recommendationCategory.create({ data: { name: "Pizza" } });
      const categoryB = await prisma.recommendationCategory.create({ data: { name: "Sobremesa" } });
      await prisma.recommendation.create({
        data: { spaceId, name: "Pizza Portuguesa", categoryId: categoryA.id, createdById: userId, updatedById: userId },
      });
      const candidates = await recommendationsService.findDedupCandidates(spaceId, "Pizza Portuguesa", categoryB.id);
      expect(candidates).toHaveLength(0);
    });

    it("isolamento por spaceId", async () => {
      const category = await prisma.recommendationCategory.create({ data: { name: "Pizza" } });
      await prisma.recommendation.create({
        data: { spaceId: otherSpaceId, name: "Pizza Portuguesa", categoryId: category.id, createdById: userId, updatedById: userId },
      });
      const candidates = await recommendationsService.findDedupCandidates(spaceId, "Pizza Portuguesa", category.id);
      expect(candidates).toHaveLength(0);
    });
  });
});