"use client";

import { useState } from "react";
import { countryByCode } from "@/lib/countries";
import { CountryStanding, totalSpentMinor } from "@/lib/leaderboard";
import { formatPrice } from "@/lib/currency";

type SortKey = "pixels" | "spend" | "fans";

interface Props {
  countries: CountryStanding[];
  highlightCountry: string | null;
  onSelectCountry: (code: string | null) => void;
  loading?: boolean;
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: "pixels", label: "Pixels" },
  { key: "spend", label: "Spent" },
  { key: "fans", label: "Fans" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

function metricValue(s: CountryStanding, sort: SortKey): number {
  if (sort === "pixels") return s.pixels;
  if (sort === "fans") return s.fans;
  return totalSpentMinor(s);
}

function spendLabel(s: CountryStanding): string {
  const parts: string[] = [];
  if (s.spent.USD > 0) parts.push(formatPrice(s.spent.USD, "USD"));
  if (s.spent.GBP > 0) parts.push(formatPrice(s.spent.GBP, "GBP"));
  return parts.length ? parts.join(" · ") : "-";
}

export default function LeaderboardHero({ countries, highlightCountry, onSelectCountry, loading }: Props) {
  const [sort, setSort] = useState<SortKey>("pixels");

  const sorted = [...countries].sort((a, b) => metricValue(b, sort) - metricValue(a, sort));
  const max = Math.max(1, ...sorted.map((s) => metricValue(s, sort)));

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderTop: "3px solid var(--gold)",
        boxShadow: "0 18px 50px color-mix(in srgb, var(--pitch) 12%, transparent)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 18px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 17 }}>🏆</span>
          <span className="font-display" style={{ fontSize: 18, letterSpacing: "0.06em", color: "var(--fg)" }}>LIVE STANDINGS</span>
          <span className="live-dot" />
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className="btn-pop"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "5px 11px",
                cursor: "pointer",
                border: "1px solid var(--border)",
                background: sort === s.key ? "var(--accent)" : "transparent",
                color: sort === s.key ? "var(--accent-fg)" : "var(--muted-fg)",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {sorted.length === 0 && (
          <div style={{ padding: "30px 18px", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--muted-fg)", textAlign: "center" }}>
            {loading ? "Loading standings…" : "No pixels claimed yet, be the first to fly your flag. 🏴"}
          </div>
        )}
        {sorted.map((s, i) => {
          const c = countryByCode[s.code];
          const rank = i + 1;
          const active = highlightCountry === s.code;
          const pct = (metricValue(s, sort) / max) * 100;
          const barColor = c?.primaryColor ?? "#888888";
          return (
            <button
              key={s.code}
              onClick={() => onSelectCountry(active ? null : s.code)}
              title="Highlight this nation's pixels on the wall"
              className="row-lift"
              style={{
                position: "relative",
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 18px",
                cursor: "pointer",
                textAlign: "left",
                border: "none",
                borderBottom: "1px solid var(--border)",
                borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
                background: active ? "color-mix(in srgb, var(--gold) 12%, var(--surface))" : "transparent",
                color: "var(--fg)",
                overflow: "hidden",
              }}
            >
              {/* nation-coloured strength bar behind content */}
              <div className="bar-track" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                <div
                  className="bar-fill"
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, color-mix(in srgb, ${barColor} 26%, transparent), transparent)`,
                  }}
                />
              </div>

              {/* rank */}
              <span className="font-display" style={{ position: "relative", zIndex: 1, width: 26, fontSize: rank <= 3 ? 18 : 16, textAlign: "center", color: rank === 1 ? "var(--gold)" : "var(--muted-fg)", flexShrink: 0 }}>
                {rank <= 3 ? MEDALS[rank - 1] : rank}
              </span>
              <span style={{ position: "relative", zIndex: 1, fontSize: 21, lineHeight: 1, flexShrink: 0 }}>{c?.flagEmoji ?? "🏳️"}</span>
              <span style={{ position: "relative", zIndex: 1, flex: 1, fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c?.name ?? s.code}
              </span>

              <span style={{ position: "relative", zIndex: 1, display: "flex", gap: 18, alignItems: "baseline", flexShrink: 0 }}>
                <Metric value={s.pixels.toLocaleString()} label="px" active={sort === "pixels"} />
                <Metric value={spendLabel(s)} label="spent" active={sort === "spend"} />
                <Metric value={s.fans.toLocaleString()} label="fans" active={sort === "fans"} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ value, label, active }: { value: string; label: string; active: boolean }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 58 }}>
      <span
        className={active ? "font-display" : undefined}
        style={{
          fontFamily: active ? "var(--font-display)" : "var(--font-mono)",
          fontSize: active ? 17 : 12,
          fontWeight: active ? 400 : 500,
          color: active ? "var(--gold)" : "var(--muted-fg)",
          letterSpacing: active ? "0.02em" : 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-fg)" }}>{label}</span>
    </span>
  );
}
