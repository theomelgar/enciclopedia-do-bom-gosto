import { Module } from "@nestjs/common";
import { SpacesController } from "./spaces.controller";
import { SpacesService } from "./spaces.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [SpacesController],
  providers: [SpacesService],
  exports: [SpacesService],
})
export class SpacesModule {}
