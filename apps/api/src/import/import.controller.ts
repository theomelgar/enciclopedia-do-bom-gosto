import { Controller, Get, Post, Param, Req, NotFoundException } from "@nestjs/common";
import { ImportService } from "./import.service";

@Controller("import")
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get(":code")
  preview(@Param("code") code: string) {
    return this.importService.preview(code);
  }

  @Post(":code")
  confirm(@Req() req: any, @Param("code") code: string) {
    return this.importService.confirm(code, req.spaceId, req.user.id);
  }
}