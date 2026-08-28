import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Enciclopédia do Bom Gosto",
  description: "Sua memória compartilhada de recomendações.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  viewportFit: "cover", // obrigatório p/ env(safe-area-inset-bottom) reportar valor real no iOS
  themeColor: "#FAF6F1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
