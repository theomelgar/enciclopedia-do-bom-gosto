import { Controller, Get, Query, Req } from "@nestjs/common";
import { SearchService } from "./search.service";
import { searchQuerySchema } from "@ebg/shared-types";

// Contrato: API_SPEC.md §Search — busca por intenção (INV-002), nunca por estrutura de banco.
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Req() req: any, @Query() query: any) {
    const dto = searchQuerySchema.parse(query);
    return this.searchService.search(req.spaceId, dto);
  }

  @Get("keywords")
  autocomplete(@Req() req: any, @Query("prefix") prefix: string) {
    return this.searchService.autocompleteKeywords(req.spaceId, prefix);
  }
}
