"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useSpaceMembers } from "@/hooks/use-space-members";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { LogOut, Sun, Moon, Monitor } from "lucide-react";
import { useMe } from "@/hooks/use-me";
import { useUploadAvatar } from "@/hooks/use-profile";

export default function PerfilPage() {
  const { data: members, isLoading } = useSpaceMembers();
  const router = useRouter();
  const { data: me } = useMe();
  const uploadAvatar = useUploadAvatar();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleRegisterPasskey() {
    const { data, error } = await supabase.auth.registerPasskey();
    if (error) {
     alert("Não deu pra cadastrar: " + error.message);
     return;
    }
    alert(`Passkey "${data.friendly_name}" cadastrada!`);
  }

  return (
    <main className="min-h-screen p-4 flex flex-col gap-6 md:max-w-lg md:mx-auto md:pt-10">
      <header>
        <h1 className="font-display text-xl text-text">Perfil</h1>
      </header>
      <section className="flex items-center gap-4">
        <label className="relative h-16 w-16 rounded-full overflow-hidden bg-surface cursor-pointer shrink-0">
          {me?.user.avatarUrl ? (
            <img src={me.user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-xl">👤</span>
          )}
          {uploadAvatar.isPending && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadAvatar.isPending}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar.mutate(f); }}
          />
        </label>
        <div>
          <p className="text-text font-medium">{me?.user?.name}</p>
          <p className="text-neutral text-sm">{me?.user?.email}</p>
        </div>
      </section>
      <section>
        <h2 className="font-display text-sm text-neutral uppercase tracking-wide mb-2">Espaço</h2>
        {isLoading && <p className="text-sm text-neutral">Carregando...</p>}
        <ul className="flex flex-col gap-1">
          {members?.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-3 text-sm">
                
              <div className="flex gap-2 items-center">
                <label className="relative h-16 w-16 rounded-full overflow-hidden bg-surface cursor-pointer shrink-0">
                 {me?.user.avatarUrl ? (
                   <img src={me.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                 ) : (
                   <span className="flex h-full items-center justify-center text-xl">👤</span>
                 )}          
                 </label>
              <div className="flex flex-col">
                <span className="text-text">{m.user.name}</span>
                <span className="text-neutral text-xs">{m.user.email}</span>
              </div>
              </div>
              {m.role === "OWNER" && (
                <span className="text-xs text-neutral rounded-full bg-background px-2 py-0.5">Dono</span>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-sm text-neutral uppercase tracking-wide mb-2">Segurança</h2>
        <button
          onClick={handleRegisterPasskey}
          className="rounded-xl bg-surface px-4 py-3 text-sm text-primary-accent font-medium"
        >
          Ativar passkey neste dispositivo
        </button>
      </section>
      <section>
        <h2 className="font-display text-sm text-neutral uppercase tracking-wide mb-2">Aparência</h2>
        {mounted && (
          <div className="flex gap-2">
            {[
              { key: "light", label: "Claro", icon: Sun },
              { key: "dark", label: "Escuro", icon: Moon },
              { key: "system", label: "Sistema", icon: Monitor },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-3 text-xs ${
                  theme === key ? "bg-primary text-white" : "bg-surface text-text"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        )}
      </section>
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 rounded-xl border border-destructive/30 text-destructive py-3 text-sm font-medium"
      >
        <LogOut size={16} />
        Sair
      </button>
    </main>
  );
}