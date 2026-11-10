import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "OpenCode Chat", description: "Seu ambiente pessoal de desenvolvimento por conversa." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
