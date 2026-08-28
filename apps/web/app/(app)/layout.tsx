"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { AppShell } from "@/components/nav/AppShell";

// Guard simples: sem sessão -> /login. `undefined` = ainda carregando (evita flash de redirect).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  if (session === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral">Carregando...</p>
      </main>
    );
  }
  if (!session) return null;

  return <AppShell>{children}</AppShell>;
}
