import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageModule } from "../storage/storage.module";
import { PhotosService } from "./photos.service";
import { PhotosController } from "./photos.controller";

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}