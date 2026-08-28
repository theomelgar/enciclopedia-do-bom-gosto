"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar({ onAddClick }: { onAddClick: () => void }) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS.filter((i) => i.key !== "perfil");
  const perfil = NAV_ITEMS.find((i) => i.key === "perfil")!;

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-black/5 bg-background px-4 py-6">
      <Link href="/home" className="font-display text-lg leading-tight text-primary mb-6 px-2">
        Enciclopédia
        <br />
        do Bom Gosto
      </Link>

      <button
        onClick={onAddClick}
        className="flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-3 mb-6 text-sm font-medium"
      >
        <Plus size={18} strokeWidth={2.5} />
        Nova recomendação
      </button>

      <nav className="flex flex-col gap-1" aria-label="Navegação principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
               key={item.key}
               href={item.href}
               className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
               active ? "bg-surface text-primary-accent font-medium" : "text-text hover:bg-surface/60"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-black/5 pt-3">
        <Link
          href={perfil.href}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
            perfil.match(pathname) ? "bg-surface text-primary-accent font-medium" : "text-text hover:bg-surface/60"
          }`}
        >
          <perfil.icon size={19} strokeWidth={perfil.match(pathname) ? 2.25 : 1.75} />
          {perfil.label}
        </Link>
      </div>
    </aside>
  );
}