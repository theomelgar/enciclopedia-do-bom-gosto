"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export function CategoryAutocomplete({
  value,
  onChange,
  useSearch,
}: {
  value: string;
  onChange: (name: string) => void;
  useSearch: (q: string) => { data?: Category[] };
}) {
  const [open, setOpen] = useState(false);
  const { data: options } = useSearch(value);

  const exactMatch = options?.some((c) => c.name.toLowerCase() === value.trim().toLowerCase());

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Categoria"
        className="w-full rounded-lg border border-neutral/30 bg-surface px-3 py-2 text-text"
      />
      {open && value.trim().length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg bg-background shadow-md max-h-48 overflow-y-auto">
          {options?.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={() => { onChange(c.name); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-surface text-text"
              >
                {c.icon ? `${c.icon} ` : ""}{c.name}
              </button>
            </li>
          ))}
          {!exactMatch && value.trim().length > 0 && (
            <li>
              <button
                type="button"
                onMouseDown={() => setOpen(false)}
                className="w-full text-left px-3 py-2 text-neutral text-sm"
              >
                Criar "{value.trim()}"
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}