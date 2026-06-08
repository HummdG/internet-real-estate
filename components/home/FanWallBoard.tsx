"use client";

import { useEffect, useState } from "react";
import PixelGridClient from "@/components/grid/PixelGridClient";
import LeaderboardHero from "@/components/leaderboard/LeaderboardHero";
import Confetti from "@/components/decor/Confetti";
import { LeaderboardData } from "@/lib/leaderboard";
import { TOTAL_PIXELS } from "@/lib/grid/constants";
import { countryByCode } from "@/lib/countries";

const EMPTY: LeaderboardData = { countries: [], totals: { pixelsSold: 0, pixelsRemaining: TOTAL_PIXELS } };

export default function FanWallBoard() {
  const [data, setData] = useState<LeaderboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [highlightCountry, setHighlightCountry] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/leaderboard")
        .then((r) => r.json())
        .then((d: LeaderboardData) => {
          if (alive) {
            setData(d);
            setLoading(false);
          }
        })
        .catch(() => alive && setLoading(false));
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const { pixelsSold, pixelsRemaining } = data.totals;
  const pct = ((pixelsSold / TOTAL_PIXELS) * 100).toFixed(2);
  const totalFans = data.countries.reduce((s, c) => s + c.fans, 0);
  const highlighted = highlightCountry ? countryByCode[highlightCountry] : undefined;

  const scoreboard = [
    { label: "Pixels claimed", value: pixelsSold.toLocaleString() },
    { label: "Nations on the board", value: data.countries.length.toString() },
    { label: "Loyal fans", value: totalFans.toLocaleString() },
  ];

  return (
    <>
      {/* ===== HERO ===== */}
      <section style={{ position: "relative", overflow: "hidden", background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "44px 24px 40px" }}>
        <div className="flood flood-l" />
        <div className="flood flood-r" />
        <Confetti />

        <div style={{ position: "relative", zIndex: 3, maxWidth: 1120, margin: "0 auto" }}>
          <div className="rise rise-1" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.24em", color: "var(--pitch)", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
            <span className="live-dot" /> The race for the wall · live
          </div>

          <h1 className="font-display rise rise-2" style={{ fontSize: "clamp(38px, 7vw, 92px)", lineHeight: 0.9, letterSpacing: "0.005em", textTransform: "uppercase", color: "var(--fg)", marginBottom: 16, maxWidth: 980 }}>
            Every pixel a vote <br />
            for your <span className="shimmer">nation</span>
          </h1>

          <p className="rise rise-3" style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--fg-soft)", marginBottom: 26, maxWidth: 600, lineHeight: 1.55 }}>
            Claim pixels, paint them, fly your flag. The more a nation&apos;s fans buy, the higher they climb.
            Tap a country to light up its territory on the wall.
          </p>

          {/* Scoreboard */}
          <div className="rise rise-3" style={{ display: "flex", flexWrap: "wrap", gap: 1, marginBottom: 30, border: "1px solid var(--border)", background: "var(--border)", width: "fit-content" }}>
            {scoreboard.map((s) => (
              <div key={s.label} style={{ background: "var(--surface)", padding: "14px 26px", minWidth: 150 }}>
                <div className="font-display" style={{ fontSize: 34, lineHeight: 1, color: "var(--gold)", letterSpacing: "0.02em" }}>{s.value}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.13em", color: "var(--muted-fg)", textTransform: "uppercase", marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rise rise-4">
            <LeaderboardHero countries={data.countries} highlightCountry={highlightCountry} onSelectCountry={setHighlightCountry} loading={loading} />
          </div>
        </div>
      </section>

      {/* ===== CONTROL BAR (grid controls portal in here) ===== */}
      <div style={{ flexShrink: 0, height: 44, borderBottom: "1px solid var(--border)", background: "var(--surface)", padding: "0 12px 0 8px", display: "flex", alignItems: "center", gap: 12 }}>
        <div id="grid-controls-bar" style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }} />
        <div id="grid-info-bar" style={{ flex: 1, display: "flex", alignItems: "center" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div id="grid-zoom-bar" style={{ display: "flex", alignItems: "center", gap: 2 }} />
          <div style={{ display: "flex", gap: 14 }} className="hide-sm">
            {[
              { label: "Sold", value: pixelsSold.toLocaleString(), accent: true },
              { label: "Left", value: pixelsRemaining.toLocaleString() },
              { label: "Claimed", value: `${pct}%` },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", gap: 5, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--muted-fg)", textTransform: "uppercase" }}>{stat.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: stat.accent ? "var(--pitch)" : "var(--fg)" }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== JUMBOTRON STADIUM ===== */}
      <section
        id="grid"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "44px 24px 34px",
          background: "radial-gradient(120% 80% at 50% -10%, #112a1d 0%, #081711 45%, #04100b 100%)",
          borderTop: "1px solid #0c2017",
        }}
      >
        <div className="flood flood-l" style={{ top: "-30%" }} />
        <div className="flood flood-r" style={{ top: "-30%" }} />
        <div className="crowd" />

        <div style={{ position: "relative", zIndex: 3, maxWidth: 1280, margin: "0 auto" }}>
          {/* Jumbotron housing */}
          <div
            style={{
              position: "relative",
              background: "linear-gradient(180deg, #14130f, #0a0a08)",
              border: "1px solid #2b2a24",
              borderRadius: 8,
              padding: 14,
              boxShadow: "0 30px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* corner rivets */}
            {[
              { top: 7, left: 7 },
              { top: 7, right: 7 },
              { bottom: 7, left: 7 },
              { bottom: 7, right: 7 },
            ].map((pos, i) => (
              <span key={i} style={{ position: "absolute", width: 6, height: 6, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #777, #222)", boxShadow: "inset 0 0 2px #000", ...pos }} />
            ))}

            {/* Scoreboard top strip */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 12px", gap: 12 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.2em", color: "#7d8a82", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
                {highlighted ? (
                  <span style={{ color: "#ffd34d" }}>{highlighted.flagEmoji} {highlighted.name} highlighted</span>
                ) : (
                  <>1000 × 1000 fan wall</>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", color: "#ffd34d", textTransform: "uppercase" }}>{pct}% claimed</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", color: "#ff5a3c", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="live-dot" /> Live
                </span>
              </div>
            </div>

            {/* The screen */}
            <div
              className="jumbo-scan"
              style={{
                position: "relative",
                height: "clamp(380px, 60vh, 760px)",
                width: "100%",
                border: "2px solid #000",
                outline: "3px solid var(--pitch)",
                outlineOffset: -1,
                background: "#fff",
                boxShadow: "inset 0 0 60px rgba(0,0,0,0.45), 0 0 50px color-mix(in srgb, var(--pitch) 28%, transparent)",
                overflow: "hidden",
              }}
            >
              <PixelGridClient highlightCountry={highlightCountry} />
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", color: "#5f7068", textTransform: "uppercase" }}>
            Drag to select · scroll to zoom · click a claimed block for details
          </div>
        </div>
      </section>
    </>
  );
}
