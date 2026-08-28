"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "./nav-items";

export function BottomBar({ onAddClick }: { onAddClick: () => void }) {
  const pathname = usePathname();
  const left = NAV_ITEMS.slice(0, 2);
  const right = NAV_ITEMS.slice(2);

  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center h-[60px] border-t border-black/5 bg-background/95 backdrop-blur"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
    >
      {left.map((item) => (
        <TabLink key={item.key} item={item} active={item.match(pathname)} />
      ))}

      <button
        aria-label="Adicionar recomendação"
        onClick={onAddClick}
        className="relative -top-5 h-14 w-14 shrink-0 rounded-full bg-primary text-white shadow-md flex items-center justify-center active:scale-[0.97] transition-transform"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {right.map((item) => (
        <TabLink key={item.key} item={item} active={item.match(pathname)} />
      ))}
    </nav>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]">
      <Icon size={22} strokeWidth={active ? 2.25 : 1.75} className={active ? "text-primary-accent" : "text-neutral"} />
      <span className={active ? "font-medium text-primary-accent" : "text-neutral"}>{item.label}</span>
    </Link>
  );
}