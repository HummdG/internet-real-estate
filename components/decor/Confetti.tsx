// One-shot confetti burst on arrival (decorative, pointer-events: none).
// Deterministic per-index values so server + client markup match (no Math.random,
// which would cause hydration mismatches).
const COLORS = ["#2fe089", "#ffd34d", "#e23b22", "#3aa0ff", "#ffffff", "#ff5aa8"];

export default function Confetti({ count = 26 }: { count?: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 2 }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 37) % 100; // spread deterministically
        const delay = (i % 9) * 0.18;
        const duration = 2.2 + ((i * 13) % 16) / 10; // 2.2s–3.7s
        const color = COLORS[i % COLORS.length];
        const tilt = ((i * 47) % 60) - 30;
        return (
          <span
            key={i}
            className="confetti"
            style={{
              left: `${left}%`,
              background: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${tilt}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}
