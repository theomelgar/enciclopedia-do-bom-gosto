import { Controller, Get, Post, Body, Req } from "@nestjs/common";
import { SpacesService } from "./spaces.service";

// Contrato: API_SPEC.md §Spaces
@Controller("spaces")
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get("members")
  members(@Req() req: any) {
    // Space ativo (req.spaceId) — mesmo escopo usado em todo o resto da API (INV-007)
    return this.spacesService.listMembers(req.spaceId);
  }

  @Post()
  create(@Req() req: any, @Body("name") name: string) {
    // Fase 3 — múltiplos Spaces (INV-007 continua valendo: recurso nasce vinculado ao criador)
    return this.spacesService.create(req.user.id, name);
  }
  
}
