import { RootProvider } from "fumadocs-ui/provider/next"
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./global.css"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Manual — VectorOps",
    template: "%s — Manual VectorOps",
  },
  description:
    "Manual de uso do VectorOps — plataforma de coordenação de equipes e gestão de chamados da Inovar Sistemas.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${jetbrainsMono.variable}`}
    >
      <body style={{ fontFamily: "var(--font-sans)" }}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
