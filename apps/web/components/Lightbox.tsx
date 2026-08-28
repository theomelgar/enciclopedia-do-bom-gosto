"use client";

interface LightboxProps {
  url: string;
  onClose: () => void;
}

export function Lightbox({ url, onClose }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl leading-none"
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-full max-w-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}