// Helper genérico de paginação cursor-based — API_SPEC.md §Convenções (default 20, max 50).
// Padrão: buscar `take+1` registros; se vier o extra, ainda há próxima página.
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export function toCursorPage<T extends { id: string }>(rows: T[], take: number): CursorPage<T> {
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

export function cursorArgs(cursor?: string, take = 20) {
  return {
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };
}
