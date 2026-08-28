import { Module } from "@nestjs/common";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";
import { SupabaseService } from "../supabase/supabase.service";

@Module({
  controllers: [StorageController],
  providers: [StorageService, SupabaseService],
  exports: [StorageService],
})
export class StorageModule {}