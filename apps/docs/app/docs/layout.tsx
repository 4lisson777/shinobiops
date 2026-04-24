import { DocsLayout } from "fumadocs-ui/layouts/docs"
import type { ReactNode } from "react"
import { source } from "@/lib/source"

function VectorMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ color: "oklch(0.68 0.22 320)" }}
    >
      <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="11" y1="13" x2="14" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M19 5 L15 5 M19 5 L19 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DocsPageLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <VectorMark />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              vector<span style={{ color: "oklch(0.68 0.22 320)" }}>ops</span>
            </span>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "oklch(0.97 0.003 240 / 0.5)",
                border: "1px solid oklch(1 0 0 / 0.15)",
                borderRadius: "2px",
                padding: "1px 5px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              docs
            </span>
          </span>
        ),
      }}
      sidebar={{
        defaultOpenLevel: 1,
      }}
    >
      {children}
    </DocsLayout>
  )
}
