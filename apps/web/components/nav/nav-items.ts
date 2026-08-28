import { Home, Search, LayoutGrid, User, type LucideIcon } from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

// Ordem fixa: [Início, Buscar, Coleções, Perfil] — BottomBar insere o "+" entre os 2 primeiros e os 2 últimos.
export const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Início", href: "/home", icon: Home, match: (p) => p === "/home" },
  { key: "busca", label: "Buscar", href: "/busca", icon: Search, match: (p) => p.startsWith("/busca") },
  {
    key: "colecoes",
    label: "Coleções",
    href: "/colecoes",
    icon: LayoutGrid,
    match: (p) => p.startsWith("/colecoes") || p.startsWith("/colecao/"),
  },
  { key: "perfil", label: "Perfil", href: "/perfil", icon: User, match: (p) => p.startsWith("/perfil") },
];