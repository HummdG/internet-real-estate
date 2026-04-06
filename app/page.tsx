import PixelGridClient from "@/components/grid/PixelGridClient";

const TOTAL_PIXELS = 1_000_000;
const PIXELS_SOLD = 0;
const PIXELS_REMAINING = TOTAL_PIXELS - PIXELS_SOLD;
const pct = ((PIXELS_SOLD / TOTAL_PIXELS) * 100).toFixed(2);

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--fg)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* STICKY HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(8px)",
          padding: "0 24px",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.18em",
            color: "#000",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              background: "var(--accent)",
            }}
          />
          PIXEL ESTATE
          <span
            style={{
              fontWeight: 400,
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "#999",
              marginLeft: 12,
              paddingLeft: 12,
              borderLeft: "1px solid #e0e0e0",
            }}
          >
            Own a piece of the internet.
          </span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="#how" style={navLinkStyle}>How It Works</a>
          <a
            href="#grid"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#fff",
              background: "var(--accent)",
              padding: "7px 18px",
              textDecoration: "none",
              textTransform: "uppercase" as const,
            }}
          >
            Buy Pixels
          </a>
        </nav>
      </header>

      {/* INSTRUCTION BAR */}
      <div
        style={{
          flexShrink: 0,
          height: 44,
          borderBottom: "1px solid var(--border)",
          background: "#fafafa",
          padding: "0 12px 0 8px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Left: mode controls (portalled from PixelGrid) */}
        <div id="grid-controls-bar" style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }} />

        {/* Center: selection info or hint text (portalled from PixelGrid) */}
        <div id="grid-info-bar" style={{ flex: 1, display: "flex", alignItems: "center" }} />

        {/* Right: zoom controls (portalled from PixelGrid) + stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div id="grid-zoom-bar" style={{ display: "flex", alignItems: "center", gap: 2 }} />
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "Sold", value: PIXELS_SOLD.toLocaleString(), accent: true },
              { label: "Remaining", value: PIXELS_REMAINING.toLocaleString() },
              { label: "Claimed", value: `${pct}%` },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", gap: 5, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", color: "#bbb", textTransform: "uppercase" as const }}>
                  {stat.label}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: stat.accent ? "var(--accent)" : "#555", letterSpacing: "-0.02em" }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRID */}
      <div
        id="grid"
        style={{
          flexShrink: 0,
          padding: "28px 24px 20px",
          background: "#0a0a0a",
          borderTop: "1px solid #1a1a1a",
          borderBottom: "1px solid #1a1a1a",
          position: "relative",
        }}
      >
        {/* Corner labels */}
        <div style={{
          position: "absolute",
          top: 8,
          left: 24,
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.2em",
          color: "#666",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}>
          1000 × 1000 PIXEL CANVAS
        </div>
        <div style={{
          position: "absolute",
          top: 8,
          right: 24,
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.12em",
          color: "#666",
          pointerEvents: "none",
        }}>
          LIVE
          <span style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#22c55e",
            marginLeft: 5,
            verticalAlign: "middle",
            boxShadow: "0 0 6px #22c55e",
          }} />
        </div>

        <div
          style={{
            height: "calc(100vh - 52px - 44px - 48px)",
            width: "100%",
            position: "relative",
            border: "1px solid #2a2a2a",
            boxShadow: "0 0 0 1px #111, inset 0 0 40px rgba(0,0,0,0.4), 0 8px 40px rgba(0,0,0,0.6)",
            background: "#fff",
            outline: "3px solid var(--accent)",
            outlineOffset: "-1px",
          }}
        >
          <PixelGridClient />
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section
        id="how"
        style={{
          padding: "64px 24px",
          borderTop: "1px solid var(--border)",
          background: "#f8f8f8",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "var(--accent)",
              textTransform: "uppercase" as const,
              marginBottom: 12,
            }}
          >
            How it works
          </div>
          <h2
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(22px, 3vw, 36px)",
              fontWeight: 700,
              marginBottom: 48,
              letterSpacing: "-0.02em",
              color: "#000",
            }}
          >
            Four steps to own internet real estate
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 2,
            }}
          >
            {[
              {
                step: "01",
                title: "Paint your pixels",
                body: "Drag across the grid to select any region. Each pixel costs $1. Select scattered pixels or solid blocks.",
              },
              {
                step: "02",
                title: "Pay and claim",
                body: "Pay via Stripe. You'll receive a permanent edit link by email. No account needed. That link is yours forever.",
              },
              {
                step: "03",
                title: "Paint your space",
                body: "Use the pixel editor to paint, fill, or import your logo. Once you save, your art appears live on the grid.",
              },
              {
                step: "04",
                title: "Trade on the marketplace",
                body: "Your pixels are yours to keep or sell. List them at any price. We take 2%, you keep the rest.",
              },
            ].map((s) => (
              <div
                key={s.step}
                style={{
                  padding: "28px 24px",
                  background: "#fff",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--accent)",
                    marginBottom: 14,
                    letterSpacing: "0.1em",
                  }}
                >
                  {s.step}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 10,
                    letterSpacing: "-0.01em",
                    color: "#000",
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ fontSize: 13, fontWeight: 300, color: "#888", lineHeight: 1.65 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px", background: "#f0f0f0" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap" as const,
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#000" }}>
            PIXEL ESTATE
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#aaa", letterSpacing: "0.08em" }}>
            Inspired by the Million Dollar Homepage (2005) by Alex Tew.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["X / Twitter", "Reddit", "LinkedIn"].map((name) => (
              <span key={name} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.12em",
  color: "#888",
  textDecoration: "none",
  textTransform: "uppercase",
};
