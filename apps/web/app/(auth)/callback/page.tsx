"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

// Supabase-js processa o token da URL automaticamente (detectSessionInUrl, default true).
// Só esperamos a sessão aparecer e redirecionamos — ver API_SPEC.md §Auth (GET /auth/callback).
export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.replace("/home");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/home");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-neutral">Entrando...</p>
    </main>
  );
}
