"use client";

import { createClient } from "@supabase/supabase-js";

// Client-side apenas — usa a anon key (segura de expor). Sessão persiste em localStorage
// (comportamento padrão do supabase-js), lida pelo api-client pra montar o Authorization header.
// Passkeys (WebAuthn) — beta, requer opt-in explícito (@supabase/supabase-js >= 2.105.0).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      experimental: { passkey: true },
    },
  },
);