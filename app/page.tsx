import FanWallBoard from "@/components/home/FanWallBoard";
import ThemeToggle from "@/components/ThemeToggle";
import StadiumTicker from "@/components/decor/StadiumTicker";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--fg)", fontFamily: "var(--font-body)" }}>
      {/* STICKY HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(10px)",
          padding: "0 22px",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a href="#top" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <span className="float" style={{ fontSize: 20, lineHeight: 1, filter: "drop-shadow(0 0 10px var(--flood-warm))" }}>🏟️</span>
          <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="font-display" style={{ fontSize: 24, letterSpacing: "0.02em", color: "var(--fg)", lineHeight: 1 }}>
              THE <span className="shimmer">FAN WALL</span>
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", color: "var(--muted-fg)", textTransform: "uppercase" }} className="hide-sm">
              · every pixel a vote
            </span>
          </span>
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="#rules" style={navLinkStyle}>Match Rules</a>
          <ThemeToggle />
          <a
            href="#grid"
            className="btn-pop"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              color: "var(--accent-fg)",
              background: "var(--accent)",
              padding: "9px 18px",
              textDecoration: "none",
              textTransform: "uppercase" as const,
              boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)",
            }}
          >
            Fly Your Flag ▸
          </a>
        </nav>
      </header>

      {/* LED PITCHSIDE TICKER */}
      <StadiumTicker />

      {/* HERO LEADERBOARD + JUMBOTRON GRID (interactive) */}
      <div id="top">
        <FanWallBoard />
      </div>

      {/* MATCH RULES */}
      <section
        id="rules"
        className="pitch-stripes"
        style={{ padding: "72px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-2)", position: "relative" }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", color: "var(--pitch)", textTransform: "uppercase" }}>
              ⚽ How to play
            </span>
          </div>
          <h2 className="font-display" style={{ fontSize: "clamp(34px, 6vw, 68px)", lineHeight: 0.95, marginBottom: 44, color: "var(--fg)", textTransform: "uppercase" }}>
            Put your nation <span className="shimmer">on the wall</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(232px, 1fr))", gap: 14 }}>
            {[
              { step: "01", title: "Pick your nation", body: "Choose who you rep from all 48 World Cup sides, then drag across the wall to grab your pixels, $1 each." },
              { step: "02", title: "Pay & claim", body: "Checkout with Stripe. A permanent edit link lands in your inbox, no account, no password. It's yours forever." },
              { step: "03", title: "Paint your patch", body: "Open the editor and paint your crest, flag or message pixel by pixel. Save it and it's live on the wall instantly." },
              { step: "04", title: "Top the table", body: "Every pixel counts toward your nation's tally. Resell on the marketplace anytime, we take 2%, you keep the rest." },
            ].map((s, i) => (
              <div
                key={s.step}
                className="rise"
                style={{
                  position: "relative",
                  padding: "26px 24px 28px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderTop: "3px solid var(--pitch)",
                  overflow: "hidden",
                  animationDelay: `${0.08 * i}s`,
                }}
              >
                <span
                  className="font-display"
                  style={{
                    position: "absolute",
                    top: -14,
                    right: 6,
                    fontSize: 92,
                    lineHeight: 1,
                    color: "transparent",
                    WebkitTextStroke: "1.5px color-mix(in srgb, var(--pitch) 30%, transparent)",
                    pointerEvents: "none",
                  }}
                >
                  {s.step}
                </span>
                <div className="font-display" style={{ fontSize: 22, color: "var(--gold)", marginBottom: 12, letterSpacing: "0.04em" }}>
                  {s.step}
                </div>
                <h3 style={{ fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 700, marginBottom: 9, color: "var(--fg)", position: "relative" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 13.5, color: "var(--muted-fg)", lineHeight: 1.6, position: "relative" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div className="font-display" style={{ fontSize: 18, letterSpacing: "0.04em", color: "var(--fg)" }}>
            🏟️ THE <span className="shimmer">FAN WALL</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted-fg)", letterSpacing: "0.06em" }}>
            A fan-loyalty experiment · inspired by the Million Dollar Homepage (2005)
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["X / Twitter", "Reddit", "LinkedIn"].map((name) => (
              <span key={name} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted-fg)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
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
  letterSpacing: "0.1em",
  color: "var(--muted-fg)",
  textDecoration: "none",
  textTransform: "uppercase",
};
