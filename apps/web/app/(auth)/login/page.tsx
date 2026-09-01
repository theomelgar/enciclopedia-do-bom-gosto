"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

// Fluxo: API_SPEC.md §Auth. Senha é o método primário (sessão simples, sem depender
// de deliverability de e-mail); magic link segue como opção secundária.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }
    router.push("/home");
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Digite seu e-mail acima primeiro.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setStatus(error ? "error" : "sent");
    if (error) setError(error.message);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

  async function handlePasskeyLogin() {
    setStatus("sending");
    setError("");
    const { error } = await supabase.auth.signInWithPasskey();
    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }
    router.push("/home");
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 bg-background">
      <h1 className="font-display text-2xl text-primary">Enciclopédia do Bom Gosto</h1>

      {status === "sent" ? (
        <p className="text-center text-text">
          Link enviado pra <strong>{email}</strong>. Confira sua caixa de entrada.
        </p>
      ) : !showMagicLink ? (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3 w-full max-w-sm">
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={status === "sending"}
            className="rounded-xl bg-surface text-text py-3 font-medium border border-black/10 disabled:opacity-60"
          >
            Entrar com passkey
          </button>
          <div className="text-center text-neutral text-xs">ou</div>
          <input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl bg-surface px-4 py-3 text-text placeholder:text-neutral"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-xl bg-primary text-white py-3 font-medium disabled:opacity-60"
          >
            {status === "sending" ? "Entrando..." : "Entrar"}
          </button>
          {status === "error" && <p className="text-destructive text-sm">{error}</p>}
          <button
            type="button"
            onClick={() => { setShowMagicLink(true); setStatus("idle"); setError(""); }}
            className="text-sm text-primary-accent"
          >
            ou receba um link por e-mail
          </button>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-neutral"
          >
            esqueci minha senha
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-3 w-full max-w-sm">
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
          <button
            type="button"
            onClick={() => { setShowMagicLink(false); setStatus("idle"); }}
            className="text-sm text-neutral"
          >
            voltar pro login com senha
          </button>
        </form>
      )}
    </main>
  );
}