"use client";
import { RefreshCw, AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

// Heurística 9 (UX_GUIDELINES.md): todo erro precisa de causa em linguagem simples
// + uma ação concreta de recuperação — nunca tela morta.
export function ErrorState({ message = "Não deu pra carregar agora.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-surface px-4 py-6 text-center">
      <AlertCircle size={22} className="text-destructive" />
      <p className="text-sm text-text">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-sm text-primary-accent font-medium mt-1"
        >
          <RefreshCw size={14} /> Tentar de novo
        </button>
      )}
    </div>
  );
}