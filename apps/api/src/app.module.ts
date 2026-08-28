import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { SpacesModule } from "./spaces/spaces.module";
import { RecommendationsModule } from "./recommendations/recommendations.module";
import { PlacesModule } from "./places/places.module";
import { BrandsModule } from "./brands/brands.module";
import { CollectionsModule } from "./collections/collections.module";
import { SearchModule } from "./search/search.module";
import { ExperiencesModule } from "./experiences/experiences.module";
import { StorageModule } from "./storage/storage.module";
import { ImportModule } from "./import/import.module";
import { PhotosModule } from "./photos/photos.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SpacesModule,
    RecommendationsModule,
    PlacesModule,
    BrandsModule,
    CollectionsModule,
    SearchModule,
    ExperiencesModule,
    StorageModule,
    PhotosModule,
    ImportModule,
  ],
})
export class AppModule {}
