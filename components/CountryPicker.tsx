"use client";

import { useEffect, useRef, useState } from "react";
import { WORLD_CUP_2026, getCountry } from "@/lib/countries";

interface Props {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}

/**
 * Searchable flag picker for the 48 World Cup nations. Controlled by `value`
 * (a tri-code) and `onChange`. Themed entirely via CSS variables so it adapts
 * to light/dark automatically. Reused by the purchase and resale flows.
 */
export default function CountryPicker({ value, onChange, placeholder = "Select your nation" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = getCountry(value);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? WORLD_CUP_2026.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      )
    : WORLD_CUP_2026;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--surface, #f8f8f8)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          padding: "12px 16px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {selected ? (
          <>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{selected.flagEmoji}</span>
            <span>{selected.name}</span>
            <span style={{ color: "var(--muted-fg)", marginLeft: 4 }}>{selected.code}</span>
          </>
        ) : (
          <span style={{ color: "var(--muted-fg)" }}>{placeholder}</span>
        )}
        <span style={{ marginLeft: "auto", color: "var(--muted-fg)", fontSize: 11 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            maxHeight: 280,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nations…"
            style={{
              background: "var(--surface, #f8f8f8)",
              border: "none",
              borderBottom: "1px solid var(--border)",
              color: "var(--fg)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              padding: "10px 14px",
              outline: "none",
            }}
          />
          <div style={{ overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--muted-fg)",
                  padding: "12px 14px",
                }}
              >
                No match
              </div>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setQuery("");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: c.code === value ? "var(--surface, #f0f0f0)" : "transparent",
                  border: "none",
                  borderLeft: c.code === value ? "3px solid var(--accent)" : "3px solid transparent",
                  color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  padding: "9px 14px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 17, lineHeight: 1 }}>{c.flagEmoji}</span>
                <span>{c.name}</span>
                <span style={{ color: "var(--muted-fg)", marginLeft: "auto", fontSize: 11 }}>{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
