// apps/web/app/(auth)/update-password/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  // adicionar no topo do componente UpdatePasswordPage
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      // sessão de recovery ativa — formulário liberado
    }
  });
  return () => subscription.unsubscribe();
}, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setStatus("error"); return; }
    router.push("/home");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4 bg-background">
      <h1 className="font-display text-xl text-primary">Definir nova senha</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="password"
          required
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl bg-surface px-4 py-3 text-text"
        />
        <button type="submit" disabled={status === "saving"} className="rounded-xl bg-primary text-white py-3">
          {status === "saving" ? "Salvando..." : "Salvar"}
        </button>
        {status === "error" && <p className="text-destructive text-sm">Link expirado — peça um novo reset.</p>}
      </form>
    </main>
  );
}