import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from "@nestjs/common";
import { CollectionsService } from "./collections.service";
import { createCollectionSchema, CreateCollectionInput } from "@ebg/shared-types";

// Contrato: API_SPEC.md §Collections — organiza, nunca possui (INV-006)
@Controller("collections")
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  list(@Req() req: any, @Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    return this.collectionsService.list(req.spaceId, { cursor, limit });
  }

  @Post()
  create(@Req() req: any, @Body() body: CreateCollectionInput) {
    const dto = createCollectionSchema.parse(body);
    return this.collectionsService.create(req.spaceId, dto);
  }

  @Patch(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() body: Partial<CreateCollectionInput>) {
    return this.collectionsService.update(req.spaceId, id, body);
  }

  @Delete(":id")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.collectionsService.remove(req.spaceId, id);
  }

  @Get(":id")
  findById(@Req() req: any, @Param("id") id: string) {
    return this.collectionsService.findById(req.spaceId, id);
  }

  @Post(":id/recommendations/:recId")
  addRecommendation(@Req() req: any, @Param("id") id: string, @Param("recId") recId: string) {
    return this.collectionsService.addRecommendation(req.spaceId, id, recId);
  }

  @Delete(":id/recommendations/:recId")
  removeRecommendation(@Req() req: any, @Param("id") id: string, @Param("recId") recId: string) {
    return this.collectionsService.removeRecommendation(req.spaceId, id, recId);
  }
}
