import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side apenas — service role key (nunca expor ao client).
// Usado por módulos que precisam de acesso privilegiado ao Supabase (Storage, admin ops).
@Injectable()
export class SupabaseService {
  public readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
}