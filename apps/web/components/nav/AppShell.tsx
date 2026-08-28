"use client";

import { useState } from "react";
import { QuickAddSheet } from "@/components/quick-add/QuickAddSheet";
import { BottomBar } from "./BottomBar";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";

// UX_GUIDELINES.md v3 §Layout Desktop — max-w centralizado, aplicado 1x aqui, nunca ad-hoc por página.
const DETAIL_ROUTES = [/^\/recomendacoes\/[^/]+$/, /^\/locais\/[^/]+$/, /^\/colecao\/[^/]+$/];

function resolveMaxWidth(pathname: string): string {
  return DETAIL_ROUTES.some((re) => re.test(pathname)) ? "md:max-w-3xl" : "md:max-w-5xl";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const pathname = usePathname();
  const maxWidthClass = resolveMaxWidth(pathname);

  return (
    <div className="md:flex">
      <Sidebar onAddClick={() => setQuickAddOpen(true)} />

      {/* padding compensa a BottomBar fixa (mobile) — some no desktop, onde a Sidebar já reserva espaço */}
      <div className="flex-1 min-w-0 pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
        <div className={`${maxWidthClass} md:mx-auto`}>{children}</div>
      </div>

      <BottomBar onAddClick={() => setQuickAddOpen(true)} />

      {quickAddOpen && <QuickAddSheet onClose={() => setQuickAddOpen(false)} />}
    </div>
  );
}