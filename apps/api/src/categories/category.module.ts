import { Module } from "@nestjs/common";
import { PlaceCategoryController, RecommendationCategoryController } from "./category.controller";
import { PlaceCategoryService, RecommendationCategoryService } from "./category.service";

@Module({
  controllers: [PlaceCategoryController, RecommendationCategoryController],
  providers: [PlaceCategoryService, RecommendationCategoryService],
})
export class CategoryModule {}