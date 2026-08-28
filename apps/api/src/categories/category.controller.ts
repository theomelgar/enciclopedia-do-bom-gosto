import { Controller, Get, Query, Req } from "@nestjs/common";
import { PlaceCategoryService, RecommendationCategoryService } from "./category.service";

@Controller("place-categories")
export class PlaceCategoryController {
  constructor(private readonly service: PlaceCategoryService) {}

  @Get()
  list(@Query("q") q?: string) {
    return this.service.list(q);
  }
}

@Controller("recommendation-categories")
export class RecommendationCategoryController {
  constructor(private readonly service: RecommendationCategoryService) {}

  @Get()
  list(@Query("q") q?: string) {
    return this.service.list(q);
  }
}