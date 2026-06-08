"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Light/dark switch. The initial attribute is set pre-paint by the inline
 * script in app/layout.tsx; this just reads it and lets the user flip + persist.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("fanwall-theme", next);
    } catch {
      /* ignore storage failures */
    }
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "day" : "night"} match`}
      aria-label="Toggle theme"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1,
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "1px solid var(--border)",
        color: "var(--fg)",
        cursor: "pointer",
      }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
