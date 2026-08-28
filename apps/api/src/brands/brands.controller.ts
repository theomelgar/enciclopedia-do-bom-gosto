import { Controller, Get, Post, Body, Param, Query, Req } from "@nestjs/common";
import { BrandsService } from "./brands.service";

// Contrato: API_SPEC.md §Brands
@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  list(@Req() req: any, @Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    return this.brandsService.list(req.spaceId, { cursor, limit });
  }

  @Post()
  create(@Req() req: any, @Body("name") name: string) {
    return this.brandsService.create(req.spaceId, name);
  }

  @Get(":id")
  detail(@Req() req: any, @Param("id") id: string) {
    return this.brandsService.findById(req.spaceId, id);
  }
}
