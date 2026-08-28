import { Module } from "@nestjs/common";
import { PlacesController } from "./places.controller";
import { PlacesService } from "./places.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [PlacesController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}