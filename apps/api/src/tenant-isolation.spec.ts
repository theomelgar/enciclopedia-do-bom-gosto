import { RecommendationsService } from "./recommendations/recommendations.service";
import { BrandsService } from "./brands/brands.service";
import { ExperiencesService } from "./experiences/experiences.service";
import { CollectionsService } from "./collections/collections.service";
import { prisma, truncateAll, seedSpace, seedUser } from "../test/db-helpers";

// STATE.md §Estratégia de Testes, prioridade 2. RLS do Postgres é inerte hoje
// (conexão do Prisma não seta contexto de sessão — ver decisão de sessão) —
// isolamento real é 100% where:spaceId no app-layer. Este spec prova que cada
// método id-scoped rejeita acesso vindo de um spaceId que não é dono do registro.
describe("Isolamento por spaceId (INV-007) — app-layer", () => {
  const searchServiceStub = { searchIds: async () => [] } as any;
  const storageServiceStub = { getSignedReadUrls: async () => ({}), getSignedReadUrl: async (p: string) => p } as any;

  const recommendationsService = new RecommendationsService(prisma as any, searchServiceStub, storageServiceStub);
  const collectionsService = new CollectionsService(prisma as any, storageServiceStub);
  const brandsService = new BrandsService(prisma as any);
  const experiencesService = new ExperiencesService(prisma as any);
  
  let spaceA: string;
  let spaceB: string;
  let userId: string;

  beforeEach(async () => {
    await truncateAll();
    spaceA = (await seedSpace("Space A")).id;
    spaceB = (await seedSpace("Space B")).id;
    userId = (await seedUser()).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Recommendation", () => {
    it("findById com spaceId errado não retorna o registro de outro Space", async () => {
      const rec = await prisma.recommendation.create({
        data: { spaceId: spaceA, name: "Pizza Portuguesa", createdById: userId, updatedById: userId },
      });
      await expect(recommendationsService.findById(spaceB, rec.id)).rejects.toThrow();
      await expect(recommendationsService.findById(spaceA, rec.id)).resolves.toMatchObject({ id: rec.id });
    });

    it("remove com spaceId errado não apaga registro de outro Space", async () => {
      const rec = await prisma.recommendation.create({
        data: { spaceId: spaceA, name: "Pizza Portuguesa", createdById: userId, updatedById: userId },
      });
      await expect(recommendationsService.remove(spaceB, rec.id)).rejects.toThrow();
      const stillThere = await prisma.recommendation.findUnique({ where: { id: rec.id } });
      expect(stillThere).not.toBeNull();
    });

    it("setVerdict com spaceId errado não altera registro de outro Space", async () => {
      const rec = await prisma.recommendation.create({
        data: { spaceId: spaceA, name: "Pizza Portuguesa", status: "WANT_TO_TRY", createdById: userId, updatedById: userId },
      });
      await expect(
        recommendationsService.setVerdict(spaceB, rec.id, { verdict: "RECOMMEND", rating: 5 } as any),
      ).rejects.toThrow();
      const unchanged = await prisma.recommendation.findUniqueOrThrow({ where: { id: rec.id } });
      expect(unchanged.status).toBe("WANT_TO_TRY");
    });
  });

  describe("Collection", () => {
    it("findById com spaceId errado não retorna a Collection de outro Space", async () => {
      const collection = await prisma.collection.create({ data: { spaceId: spaceA, name: "Pizza" } });
      await expect(collectionsService.findById(spaceB, collection.id)).rejects.toThrow();
      await expect(collectionsService.findById(spaceA, collection.id)).resolves.toMatchObject({ id: collection.id });
    });

    it("addRecommendation com spaceId errado não vincula a Collection de outro Space", async () => {
      const collection = await prisma.collection.create({ data: { spaceId: spaceA, name: "Pizza" } });
      const rec = await prisma.recommendation.create({
        data: { spaceId: spaceA, name: "Pizza Portuguesa", createdById: userId, updatedById: userId },
      });
      await expect(collectionsService.addRecommendation(spaceB, collection.id, rec.id)).rejects.toThrow();
    });
  });

    describe("Brand", () => {
    it("findById com spaceId errado não retorna a Brand de outro Space", async () => {
      const brand = await prisma.brand.create({ data: { spaceId: spaceA, name: "Nike" } });
      await expect(brandsService.findById(spaceB, brand.id)).rejects.toThrow();
      await expect(brandsService.findById(spaceA, brand.id)).resolves.toMatchObject({ id: brand.id });
    });
  });

  describe("Experience", () => {
    it("update com spaceId errado não altera Experience de Recommendation de outro Space", async () => {
      const rec = await prisma.recommendation.create({
        data: { spaceId: spaceA, name: "Pizza Portuguesa", createdById: userId, updatedById: userId },
      });
      const exp = await prisma.experience.create({
        data: { recommendationId: rec.id, authorId: userId, rating: 3, comment: "original" },
      });
      await expect(
        experiencesService.update(spaceB, exp.id, { comment: "invadido" }),
      ).rejects.toThrow();
      const unchanged = await prisma.experience.findUniqueOrThrow({ where: { id: exp.id } });
      expect(unchanged.comment).toBe("original");
    });
  });
});