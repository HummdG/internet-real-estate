"use client";

import dynamic from "next/dynamic";

const PixelGrid = dynamic(() => import("./PixelGrid"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#2a2a2a",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        letterSpacing: "0.1em",
      }}
    >
      LOADING GRID...
    </div>
  ),
});

export default function PixelGridClient({ highlightCountry }: { highlightCountry?: string | null }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <PixelGrid highlightCountry={highlightCountry} />
    </div>
  );
}
