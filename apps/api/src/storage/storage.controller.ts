import { Controller, Post, Body, Req } from "@nestjs/common";
import { StorageService } from "./storage.service";

// Contrato: API_SPEC.md §Storage
@Controller("storage")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("sign-upload")
  signUpload(@Req() req: any, @Body("fileName") fileName: string, @Body("contentType") contentType: string) {
    return this.storageService.signUpload(req.spaceId, fileName, contentType);
  }
}
