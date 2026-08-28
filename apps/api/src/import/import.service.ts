import { Injectable, NotFoundException, GoneException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCode(code: string) {
     const entry = await this.prisma.recommendationShareCode.findUnique({
       where: { code },
       include: {
        recommendation: {
          include: {
            category: true,
            places: { include: { place: true } },
            purchaseLinks: true,
          },
        },
         createdBy: { select: { name: true } },
       },
     });
     if (!entry) throw new NotFoundException("Código não encontrado.");
     if (entry.expiresAt < new Date()) throw new GoneException("Código expirado.");
     return entry;
   }

  async preview(code: string) {
    const entry = await this.resolveCode(code);
    return {
      name: entry.recommendation.name,
      description: entry.recommendation.description,
      category: entry.recommendation.category?.name ?? null,
      sourceLabel: entry.createdBy.name,
      places: entry.recommendation.places.map((rp) => ({
        name: rp.place.name,
        address: rp.place.address,
      })),
      purchaseLinks: entry.recommendation.purchaseLinks.map((l) => ({ label: l.label, url: l.url })),
     };
   }

   async confirm(code: string, spaceId: string, userId: string) {
     const entry = await this.resolveCode(code);
    return this.prisma.$transaction(async (tx) => {
      const rec = await tx.recommendation.create({
        data: {
          space: { connect: { id: spaceId } },
          name: entry.recommendation.name,
          description: entry.recommendation.description,
          status: "WANT_TO_TRY",
          sourceLabel: `Recomendado por ${entry.createdBy.name}`,
          category: entry.recommendation.categoryId
            ? { connect: { id: entry.recommendation.categoryId } }
            : undefined,
          createdBy: { connect: { id: userId } },
          updatedBy: { connect: { id: userId } },
          purchaseLinks: entry.recommendation.purchaseLinks.length
            ? {
                create: entry.recommendation.purchaseLinks.map((l) => ({
                  label: l.label,
                  url: l.url,
                  kind: l.kind,
                })),
              }
            : undefined,
        },
      });

      // Place: cria cópia no Space de destino — sem dedup (ação pontual, não o fluxo recorrente de QuickAdd)
      for (const rp of entry.recommendation.places) {
        const newPlace = await tx.place.create({
          data: {
            spaceId,
            name: rp.place.name,
            address: rp.place.address,
            neighborhood: rp.place.neighborhood,
            city: rp.place.city,
            state: rp.place.state,
            zipCode: rp.place.zipCode,
            latitude: rp.place.latitude,
            longitude: rp.place.longitude,
            phone: rp.place.phone,
            website: rp.place.website,
            createdById: userId,
            updatedById: userId,
          },
        });
        if (newPlace.latitude != null && newPlace.longitude != null) {
          await tx.$executeRaw`
            UPDATE "place" SET geom = ST_SetSRID(ST_MakePoint(${newPlace.longitude}, ${newPlace.latitude}), 4326)::geography
            WHERE id = ${newPlace.id}
          `;
        }
        await tx.recommendationPlace.create({
          data: { recommendationId: rec.id, placeId: newPlace.id },
        });
      }

      return rec;
    });
   }
}