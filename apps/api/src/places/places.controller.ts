import { Controller, Get, Post, Patch, Body, Param, Query, Req } from "@nestjs/common";
import { PlacesService } from "./places.service";
import { createPlaceSchema, CreatePlaceInput, UpdatePlaceInput } from "@ebg/shared-types";

// Contrato: API_SPEC.md §Places
@Controller("places")
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  list(
    @Req() req: any,
    @Query("near") near?: string,
    @Query("radius") radius?: string,
    @Query("bbox") bbox?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.placesService.list(req.spaceId, { near, radius, bbox, cursor, limit });
  }

  @Post()
  create(@Req() req: any, @Body() body: CreatePlaceInput) {
    const dto = createPlaceSchema.parse(body);
    return this.placesService.create(req.spaceId, req.user.id, dto);
  }

  @Get("dedup")
  dedup(
    @Req() req: any,
    @Query("name") name: string,
    @Query("lat") lat?: string,
    @Query("lng") lng?: string,
    @Query("phone") phone?: string,
  ) {
    return this.placesService.findDedupCandidates(req.spaceId, { name, lat, lng, phone });
  }

  @Get(":id")
  detail(@Req() req: any, @Param("id") id: string) {
    return this.placesService.findById(req.spaceId, id);
  }

  @Patch(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() body: UpdatePlaceInput) {
    return this.placesService.update(req.spaceId, id, body);
  }
}