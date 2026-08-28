"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

// Fluxo: API_SPEC.md §Auth (POST /auth/magic-link é redundante aqui — usamos
// supabase-js direto no client, que é o padrão recomendado pro fluxo de magic link).
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 bg-background">
      <h1 className="font-display text-2xl text-primary">Enciclopédia do Bom Gosto</h1>

      {status === "sent" ? (
        <p className="text-center text-text">
          Link enviado pra <strong>{email}</strong>. Confira sua caixa de entrada.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
          <input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-xl bg-primary text-white py-3 font-medium disabled:opacity-60"
          >
            {status === "sending" ? "Enviando..." : "Entrar com link mágico"}
          </button>
          {status === "error" && (
            <p className="text-destructive text-sm">Não deu certo — tenta de novo.</p>
          )}
        </form>
      )}
    </main>
  );
}
