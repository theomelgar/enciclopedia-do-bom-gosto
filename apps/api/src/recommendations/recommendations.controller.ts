import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";
import { ExperiencesService } from "../experiences/experiences.service";
import {
  createRecommendationSchema,
  setVerdictSchema,
  linkPlaceSchema,
  addPriceEntrySchema,
  addPurchaseLinkSchema,
  addExperienceSchema,
  CreateRecommendationInput,
  SetVerdictInput,
  LinkPlaceInput,
  AddPriceEntryInput,
  AddPurchaseLinkInput,
  AddExperienceInput,
} from "@ebg/shared-types";

// Contrato completo: API_SPEC.md §Recommendations (Aggregate Root — ADR-001)
@Controller("recommendations")
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly experiencesService: ExperiencesService,
  ) {}

  @Get()
  list(
    @Req() req: any,
    @Query("q") q?: string,
    @Query("status") status?: string,
    @Query("collectionId") collectionId?: string,
    @Query("categoryId") categoryId?: string,
    @Query("near") near?: string,
    @Query("sort") sort?: string,
    @Query("radius") radius?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.recommendationsService.list(req.spaceId, {
      q,
      status,
      collectionId,
      categoryId,
      sort,
      near,
      radius,
      cursor,
      limit,
    });
  }

  @Post()
  create(@Req() req: any, @Body() body: CreateRecommendationInput) {
    // Cadastro mínimo nome+categoria (INV-008) — Place/Brand/PurchaseLink ficam para depois.
    const dto = createRecommendationSchema.parse(body);
    return this.recommendationsService.create(req.spaceId, req.user.id, dto);
  }

  @Get("dedup")
  dedup(@Req() req: any, @Query("name") name: string, @Query("categoryId") categoryId?: string) {
    return this.recommendationsService.findDedupCandidates(req.spaceId, name, categoryId);
  }

  @Get("suggestions")
  suggestions(@Req() req: any) {
    // Determinístico, sem IA (INV-010) — ver critérios em proposta V2 §10.
    return this.recommendationsService.dailySuggestions(req.spaceId);
  }

  @Get(":id")
  detail(@Req() req: any, @Param("id") id: string) {
    return this.recommendationsService.findById(req.spaceId, id);
  }

  @Patch(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() body: Partial<CreateRecommendationInput>) {
    return this.recommendationsService.update(req.spaceId, id, body);
  }

  @Delete(":id")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.recommendationsService.remove(req.spaceId, id);
  }

  @Post(":id/verdict")
  setVerdict(@Req() req: any, @Param("id") id: string, @Body() body: SetVerdictInput) {
    const dto = setVerdictSchema.parse(body);
    return this.recommendationsService.setVerdict(req.spaceId, id, dto);
  }

  @Post(":id/places")
  linkPlace(@Req() req: any, @Param("id") id: string, @Body() body: LinkPlaceInput) {
    const dto = linkPlaceSchema.parse(body);
    return this.recommendationsService.linkPlace(req.spaceId, id, dto);
  }

  @Delete(":id/places/:placeId")
  unlinkPlace(@Req() req: any, @Param("id") id: string, @Param("placeId") placeId: string) {
    return this.recommendationsService.unlinkPlace(req.spaceId, id, placeId);
  }

  @Post(":id/places/:placeId/price-entries")
  addPriceEntry(
    @Req() req: any,
    @Param("id") id: string,
    @Param("placeId") placeId: string,
    @Body() body: AddPriceEntryInput,
  ) {
    const dto = addPriceEntrySchema.parse(body);
    return this.recommendationsService.addPriceEntry(req.spaceId, id, placeId, dto);
  }

  @Post(":id/purchase-links")
  addPurchaseLink(@Req() req: any, @Param("id") id: string, @Body() body: AddPurchaseLinkInput) {
    const dto = addPurchaseLinkSchema.parse(body);
    return this.recommendationsService.addPurchaseLink(req.spaceId, id, dto);
  }

  @Delete(":id/purchase-links/:linkId")
  removePurchaseLink(@Req() req: any, @Param("linkId") linkId: string) {
    return this.recommendationsService.removePurchaseLink(req.spaceId, linkId);
  }

  @Post(":id/photos")
  addPhoto(@Req() req: any, @Param("id") id: string, @Body("url") url: string, @Body("kind") kind: string) {
    return this.recommendationsService.addPhoto(req.spaceId, id, url, kind);
  }

  @Post(":id/share-code")
  createShareCode(@Req() req: any, @Param("id") id: string) {
    return this.recommendationsService.createShareCode(req.spaceId, id, req.user.id);
  }

  @Post(":id/experiences")
  addExperience(@Req() req: any, @Param("id") id: string, @Body() body: AddExperienceInput) {
    const dto = addExperienceSchema.parse(body);
    return this.experiencesService.create(req.spaceId, id, req.user.id, dto);
  }

  @Patch(":id/experiences/:expId")
  updateExperience(@Req() req: any, @Param("expId") expId: string, @Body() body: Partial<AddExperienceInput>) {
    return this.experiencesService.update(req.spaceId, expId, body);
  }

  @Delete(":id/photos/:photoId")
  deletePhoto(@Req() req: any, @Param("id") id: string, @Param("photoId") photoId: string) {
    return this.recommendationsService.deletePhoto(req.spaceId, id, photoId);
  }

}