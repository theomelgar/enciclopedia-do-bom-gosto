import { Module } from "@nestjs/common";
import { ExperiencesService } from "./experiences.service";

// Sem controller próprio: experiências são criadas via
// POST /recommendations/:id/experiences (API_SPEC.md) — este módulo só expõe o service.
@Module({
  providers: [ExperiencesService],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
