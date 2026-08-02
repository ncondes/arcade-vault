import type { Metadata } from "next";
import { JetBrains_Mono, Press_Start_2P } from "next/font/google";
import Nav from "@/app/components/Nav";
import SiteFooter from "@/app/components/SiteFooter";
import "./globals.css";

// Press Start 2P no es una fuente variable: requiere weight explícito.
const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // `template` compone el título de cada ruta: "CAÍDA" -> "CAÍDA · Arcade Vault".
  title: {
    default: "Arcade Vault",
    template: "%s · Arcade Vault",
  },
  description: "Juega clásicos arcade y compite por el récord más alto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${pressStart.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <div className="av-bg" aria-hidden="true" />
        <div className="av-noise" aria-hidden="true" />
        <div className="av-shell">
          <Nav />
          <main className="av-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
