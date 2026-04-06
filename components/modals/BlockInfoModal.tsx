"use client";

import { useState } from "react";
import { BlockMeta } from "@/lib/grid/blockIndex";
import { formatPrice } from "@/lib/currency";

interface Props {
  block: BlockMeta;
  onClose: () => void;
}

export default function BlockInfoModal({ block, onClose }: Props) {
  const [buyEmail, setBuyEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pixelCount = block.width * block.height;

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    if (!block.listingPrice) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: block.id,
          buyerEmail: buyEmail,
          currency: block.listingCurrency ?? "USD",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to initiate purchase");
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Something went wrong.");
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
          background: "#fff",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          padding: "40px 32px",
          maxWidth: 400,
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: block.listed ? "rgb(255,200,0)" : "var(--accent)",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {block.listed ? "For Sale" : "Owned Block"}
        </div>

        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 20,
          }}
        >
          {block.width}×{block.height} pixels ({pixelCount.toLocaleString()} px)
        </h2>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "#555",
            marginBottom: 20,
          }}
        >
          Position: ({block.x}, {block.y})
        </div>

        {block.listed && block.listingPrice && (
          <form onSubmit={handleBuy}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 24,
                fontWeight: 700,
                color: "rgb(255,200,0)",
                marginBottom: 20,
              }}
            >
              {formatPrice(block.listingPrice, (block.listingCurrency as "USD" | "GBP") ?? "USD")}
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                type="email"
                required
                value={buyEmail}
                onChange={(e) => setBuyEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: "100%",
                  background: "#050505",
                  border: "1px solid var(--border)",
                  color: "#fff",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  padding: "10px 14px",
                  outline: "none",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "#ff4444",
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#000",
                  background: "rgb(255,200,0)",
                  border: "none",
                  padding: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "..." : "Buy Now"}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  padding: "12px 16px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "#555",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </form>
        )}

        {!block.listed && (
          <button
            onClick={onClose}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              padding: "12px 20px",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "#555",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
