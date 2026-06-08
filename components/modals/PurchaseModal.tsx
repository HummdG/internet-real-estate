"use client";

import { useState, useEffect } from "react";
import { detectCurrency, formatPrice, pixelPrice, currencySymbol } from "@/lib/currency";
import CountryPicker from "@/components/CountryPicker";

interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  selection: Selection;
  paintedPixelCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

type Currency = "USD" | "GBP";

export default function PurchaseModal({ selection, paintedPixelCount, onClose }: Props) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrency(detectCurrency() as Currency);
  }, []);

  const pixelCount = paintedPixelCount;
  const total = pixelPrice(pixelCount, currency);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!country) {
      setError("Pick the nation you're repping before claiming.");
      return;
    }

    setLoading(true);

    try {
      // 1. Reserve pixels
      const reserveRes = await fetch("/api/blocks/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x: selection.x,
          y: selection.y,
          width: selection.width,
          height: selection.height,
          currency,
          paintedPixelCount,
          country,
        }),
      });

      const reserveData = await reserveRes.json();
      if (!reserveRes.ok) {
        setError(reserveData.error ?? "Failed to reserve pixels");
        setLoading(false);
        return;
      }

      // 2. Create checkout session
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId: reserveData.blockId, email, currency }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        setError(checkoutData.error ?? "Failed to create checkout");
        setLoading(false);
        return;
      }

      // 3. Redirect to Stripe
      window.location.href = checkoutData.checkoutUrl;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--bg)",
          color: "var(--fg)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.24)",
          padding: "40px 32px",
          maxWidth: 460,
          width: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "var(--accent)",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Claim Your Pixels
        </div>
        <h2
          className="font-display"
          style={{
            fontSize: 30,
            letterSpacing: "0.01em",
            textTransform: "uppercase",
            marginBottom: 24,
            color: "var(--fg)",
          }}
        >
          {pixelCount.toLocaleString()} pixels
        </h2>

        {/* Selection summary */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            padding: "16px 20px",
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {[
            { label: "Size", value: `${selection.width} × ${selection.height}` },
            { label: "Position", value: `(${selection.x}, ${selection.y})` },
            { label: "Pixels", value: pixelCount.toLocaleString() },
            {
              label: "Total",
              value: formatPrice(total, currency),
              accent: true,
            },
          ].map((row) => (
            <div key={row.label}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: "var(--muted-fg)",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: row.accent ? "var(--accent)" : "var(--fg)",
                }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {/* Currency toggle */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.15em",
              color: "var(--muted-fg)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Currency
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {(["USD", "GBP"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "8px 20px",
                  background: currency === c ? "var(--accent)" : "var(--surface)",
                  border: "1px solid",
                  borderColor: currency === c ? "var(--accent)" : "var(--border)",
                  color: currency === c ? "var(--accent-fg)" : "var(--muted-fg)",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                {currencySymbol(c)} {c}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.15em",
                color: "var(--muted-fg)",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 8,
              }}
            >
              Your nation
            </label>
            <CountryPicker value={country} onChange={setCountry} placeholder="Who are you repping?" />
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--muted-fg)",
                marginTop: 6,
                letterSpacing: "0.05em",
              }}
            >
              Your pixels fly this flag on the leaderboard.
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.15em",
                color: "var(--muted-fg)",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 8,
              }}
            >
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                padding: "12px 16px",
                outline: "none",
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--muted-fg)",
                marginTop: 6,
                letterSpacing: "0.05em",
              }}
            >
              We'll send your permanent edit link here. Save this email.
            </div>
          </div>

          {error && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "#ff4444",
                marginBottom: 16,
                padding: "8px 12px",
                background: "rgba(255,68,68,0.1)",
                border: "1px solid rgba(255,68,68,0.2)",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-pop"
              style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent-fg)",
                background: loading ? "var(--muted)" : "var(--accent)",
                border: "none",
                padding: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 6px 20px color-mix(in srgb, var(--accent) 40%, transparent)",
              }}
            >
              {loading ? "Redirecting..." : `Pay ${formatPrice(total, currency)} ▸`}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                padding: "14px 20px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--muted-fg)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
