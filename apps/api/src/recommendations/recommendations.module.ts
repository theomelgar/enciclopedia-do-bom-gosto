import { Module } from "@nestjs/common";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";
import { ExperiencesModule } from "../experiences/experiences.module";
import { SearchModule } from "../search/search.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [ExperiencesModule, SearchModule, StorageModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}