"use client";

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

// Hook de sessão — usado pra decidir se redireciona pra /login (ver app/(app)/layout.tsx).
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = carregando

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return session;
}
