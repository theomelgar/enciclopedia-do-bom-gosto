import { Controller, Get, Param, Req } from "@nestjs/common";
import { PhotosService } from "./photos.service";

// Contrato: API_SPEC.md v4 §Storage
@Controller("photos")
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Get(":id/signed-url")
  signedUrl(@Req() req: any, @Param("id") id: string) {
    return this.photosService.getSignedUrl(req.spaceId, id);
  }
}