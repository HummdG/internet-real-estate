// Pitchside LED advertising board: an infinitely scrolling marquee.
// Pure CSS animation; the item list is rendered twice so the -50% scroll loops
// seamlessly. Hovering pauses it (see .led-ticker:hover in globals.css).
const ITEMS = [
  "⚽ Every pixel a vote",
  "Fly your flag",
  "$1 per pixel",
  "48 nations",
  "Paint the wall",
  "Who's the most loyal?",
  "Climb the leaderboard",
];

export default function StadiumTicker() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="led-ticker" aria-hidden="true">
      <div className="led-track">
        {loop.map((t, i) => (
          <span key={i} className="led-item">
            {t}
            <span className="led-dot">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
